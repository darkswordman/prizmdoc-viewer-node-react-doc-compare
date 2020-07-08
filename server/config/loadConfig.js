const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');
const configFilePath = path.join(__dirname, '../config.json5');
const configFile = JSON5.parse(fs.readFileSync(configFilePath));
const config = {
  apiKey: process.env.API_KEY || configFile.apiKey,
  pasBaseUrl: process.env.PAS_BASE_URL || configFile.pasBaseUrl,
  pasSecretKey: process.env.PAS_SECRET_KEY || configFile.pasSecretKey
};
module.exports = config;
