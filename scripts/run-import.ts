// Load environment variables
require("dotenv").config()

const { execSync } = require("child_process")
execSync("tsx scripts/import-blockchain.js", { stdio: "inherit" })