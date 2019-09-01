const router = require("express").Router();

router.use("/login", (req, res) => {
  console.log("Inside of /login\n\n\n");
});

module.exports = router;
