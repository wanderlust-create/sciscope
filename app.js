const express = require("express");
// const app = express();
// require("./src/config/loadEnv");

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello SciScope!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
