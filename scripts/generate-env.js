// scripts/generate-env.js
const fs = require('fs');
const dotenv = require('dotenv');

// Load local .env if it exists
if (fs.existsSync('.env')) {
  dotenv.config();
}

const targetPath = './src/assets/env.js';

const envConfigFile = `
window.__env = {
  UNTAPPD_USERNAME: "${process.env.UNTAPPD_USERNAME || ''}",
  DATA_URL: "${process.env.DATA_URL || ''}",
  GA4_MEASUREMENT_ID: "${process.env.GA4_MEASUREMENT_ID || ''}",
  S3_BUCKET_NAME: "${process.env.S3_BUCKET_NAME || ''}",
  LAMBDA_ZIP_FILE: "${process.env.LAMBDA_ZIP_FILE || ''}"
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Generated ${targetPath} from ${process.env.NETLIFY ? 'Netlify env variables' : '.env file'}`);
