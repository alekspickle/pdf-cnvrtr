const nconf = require("nconf");
const path = require("path");

nconf
  .argv()
  .env()
  .file({ file: path.join(__dirname, "config.json") });

//using example: config.get("port")
module.exports = nconf;
