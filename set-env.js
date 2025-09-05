const fs = require('fs');
const path = require('path');
require('dotenv').config();

const environment = process.argv[2];
const isProduction = environment === '--env=prod';
const isDevelopment = environment === '--env=dev';

if (!isProduction && !isDevelopment) {
    console.error('Error: Please provide a valid environment flag: --env=dev or --env=prod');
    process.exit(1);
}

const envFile = isProduction
    ? path.join(__dirname, 'src/environments/environment.prod.ts')
    : path.join(__dirname, 'src/environments/environment.ts');

const targetPath = isProduction
    ? 'src/environments/environment.prod.ts'
    : 'src/environments/environment.ts';

const untappdUsername = process.env.UNTAPPD_USERNAME || '';

const envContent = `
export const environment = {
  production: ${isProduction},
  untappdUsername: '${untappdUsername}'
};
`;

try {
    fs.writeFileSync(envFile, envContent);
    console.log(`Successfully wrote to ${targetPath}`);
} catch (err) {
    console.error(`Error writing to ${targetPath}:`, err);
    process.exit(1);
}
