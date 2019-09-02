// Imports
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Routers
const authRouter = require("./routes/auth");

// Constants
const PORT = process.env.PORT || 9000;

// Start app
const app = express();

// Middleware
app.use(cors());
if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
}
app.use(cookieParser());
app.use(express.static(path.join("public")));

// Routes
app.use("^/$", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "index.html"));
});

app.use("^/download$", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "download.html"));
});

app.use("/auth", authRouter);

app.use("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
