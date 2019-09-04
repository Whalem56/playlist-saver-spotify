const router = require("express").Router();
const fetch = require("node-fetch");
const querystring = require("querystring");

// Global variables
const auth_state_length = 16;
const cookie_key_auth = "spotify_auth_state";
const cookie_key_access_token = "spotify_access_token";
const redirect_uri = process.env.REDIRECT_URI;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

console.log("redirect_uri: ", redirect_uri);

// Routes Handlers
router.get("/login", (req, res) => {
  const scope = "playlist-read-private playlist-read-collaborative";
  const state = generateRandomString(auth_state_length);
  res.cookie(cookie_key_auth, state);

  res.status(300).redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        redirect_uri: redirect_uri,
        scope: scope,
        state: state
      })
  );
});

router.get("/authenticate", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[cookie_key_auth] : null;

  if (state && code && state === storedState) {
    // OK to proceed with authentication
    // Must use x-www-form-urlencoded body b/c of OAuth2.0 specification
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64")
    };

    const fetchOptions = {
      method: "POST",
      headers: headers
    };

    const body = {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri
    };

    // Try and get authentication token
    try {
      const response = await fetch(
        "https://accounts.spotify.com/api/token?" + querystring.stringify(body),
        fetchOptions
      );
      const data = await response.json();
      if (data.err) {
        throw new Error(
          "Trouble parsing json response. Unable to retrieve access token."
        );
      }
      // Success
      // res.cookie(cookie_key_access_token, data.access_token, {
      //   path: "/download"
      // });
      res.cookie(cookie_key_access_token, data.access_token);
      res.status(300).redirect("/download"); // CHANGE TO DIFFERENT TEMPLATE
    } catch (err) {
      console.log("err: ", err);
      res.status(500).redirect("/");
    }
  } else {
    console.log("State mismatch");
    res.status(500).redirect("/");
  }
});

const generateRandomString = length => {
  let result = "";
  const possibleChars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < length; i++) {
    result += possibleChars.charAt(
      Math.floor(Math.random() * possibleChars.length)
    );
  }

  return result;
};

module.exports = router;
