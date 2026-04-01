#!/usr/bin/env node

const path = require("path");

const scriptPath = path.resolve(__dirname, "../../../scripts/genProofBadge.js");
const badgeScript = require(scriptPath);

badgeScript.cli(process.argv.slice(2)).catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
