// Imports
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const result = require("dotenv").config();
console.log(result);

// Routers
const authRouter = require("./routes/auth");

// Constants
const PORT = process.env.PORT || 9000;

const app = express();
console.log(process.env.PORT);
console.log(process.env.URL);
console.log(process.env.CLIENT_ID);

// Middleware
app.use(cors());
app.use(morgan("combined"));
app.use(cookieParser());
app.use(express.static(path.join("public")));

// Routes
app.use("^/$", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "index.html"));
});

app.use("/auth", authRouter);

app.use("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
