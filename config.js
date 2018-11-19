// config.js
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  UNTAPPD_USERNAME: process.env.UNTAPPD_USERNAME
};
