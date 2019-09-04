window.onload = () => {
  const accessToken = getAccessToken();

  getPlaylistData(accessToken).then(playlistData => {
    const output = getOutput(playlistData);
    if (output) {
      download(output);
      onDownloadComplete();
    }
  });
};

function getAccessToken() {
  let accessToken = null;
  try {
    const cookies = document.cookie.replace(" ", "").split(";");
    cookies.forEach(cookie => {
      const parts = cookie.split("=");
      if (parts[0] === "spotify_access_token" && parts[1].length > 0) {
        // Client has both the key and a value for access token
        accessToken = parts[1];
      }
    });
    if (!accessToken) {
      throw new Error(
        "Cannot make necessary requests to Spotify. Please try logging in again"
      );
    }
  } catch (err) {
    errorHandler();
  }

  return accessToken;
}

async function getPlaylistData(accessToken) {
  let playlistTrackMap = null;
  try {
    // Array of objects that contain playlistId and playlistName
    const playlists = await getPlaylists(accessToken);

    // Object mapping each playlist's name to an array of tracks
    playlistTrackMap = await getTracks(playlists, accessToken);
  } catch (err) {
    errorHandler();
  }
  return playlistTrackMap;
}

async function getPlaylists(accessToken) {
  let playlists = [];

  let options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + accessToken
    }
  };

  let numPlaylists = -1;
  let offset = 0;
  const limit = 50;

  // Make first request for playlists.
  let response = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
    options
  );
  let body = await response.json();
  playlists = processPlaylistData(playlists, body.items);
  numPlaylists = body.total;
  offset += offset + limit;

  // Continue making requests for playlists if limit is less than
  // the amount of playlists
  while (offset < numPlaylists) {
    response = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
      options
    );
    body = await response.json();
    playlists = processPlaylistData(playlists, body.items);
    offset += limit;
  }

  return playlists;
}

function processPlaylistData(playlists, items) {
  const currList = items.map(playlist => {
    let pair = {};
    pair.id = playlist.id;
    pair.name = playlist.name;
    return pair;
  });

  return playlists.concat(currList);
}

async function getTracks(playlists, accessToken) {
  let playlistTrackMap = {};

  let options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + accessToken
    }
  };
  let offset = 0;
  const limit = 100;
  const fields = "total,items(track(name,artists))";

  for (let i = 0; i < playlists.length; i++) {
    const playlistId = playlists[i].id;
    const playlistName = playlists[i].name;

    offset = 0;
    let response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=${fields}`,
      options
    );
    let body = await response.json();
    const numTracks = body.total;
    processTrackData(playlistTrackMap, playlistName, body.items);
    offset += limit;

    // Continue making requests for tracks if limit is less than
    // the amount of playlists
    while (offset < numTracks) {
      response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=${fields}`,
        options
      );
      body = await response.json();
      processTrackData(playlistTrackMap, playlistName, body.items);
      offset += limit;
    }
  }
  return playlistTrackMap;
}

function processTrackData(playlistTrackMap, playlistName, items) {
  const parsedTracks = items.map((item, index) => {
    if (!item.track || !item.track.artists[0]) {
      return {
        trackName: "Unable to retrieve song from Spotify :(",
        trackArtist: ""
      };
    }
    return {
      trackName: item.track.name,
      trackArtist: item.track.artists[0].name
    };
  });

  if (playlistTrackMap.hasOwnProperty(playlistName)) {
    playlistTrackMap[playlistName] = playlistTrackMap[playlistName].concat(
      parsedTracks
    );
  } else {
    playlistTrackMap[playlistName] = parsedTracks;
  }
}

function getOutput(playlistTrackMap) {
  let output = "";
  for (let playlist in playlistTrackMap) {
    if (playlistTrackMap.hasOwnProperty(playlist)) {
      output += `\n${playlist}:\n\n`;
      playlistTrackMap[playlist].forEach(track => {
        output += `\t${track.trackName}  -  ${track.trackArtist}\n`;
      });
    }
  }
  return output;
}

function download(output) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(output)
  );
  element.setAttribute("download", "playlists.txt");
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function errorHandler() {
  alert("An error has occurred. Please try logging in again.");
  window.location.href = "http://192.168.1.8:9000/";
}

function onDownloadComplete() {
  let loadingElem = document.querySelector("#loading");
  loadingElem.classList.add("hide");

  let doneLoadingElem = document.querySelector("#done-loading");
  doneLoadingElem.classList.remove("hide");
}
