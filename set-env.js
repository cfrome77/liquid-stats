const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if the main build command includes production flags
const isProduction = process.argv.includes('--configuration=production') || process.argv.includes('--prod');

// Determine the target environment file based on the detected environment
const envFile = isProduction
    ? path.join(__dirname, 'src/environments/environment.prod.ts')
    : path.join(__dirname, 'src/environments/environment.ts');

const targetPath = isProduction
    ? 'src/environments/environment.prod.ts'
    : 'src/environments/environment.ts';

// Get the Untappd username from the environment variables
const untappdUsername = process.env.UNTAPPD_USERNAME || '';

// Create the content for the environment file
const envContent = `
export const environment = {
  production: ${isProduction},
  untappdUsername: '${untappdUsername}'
};
`;

// Write the content to the environment file
try {
    fs.writeFileSync(envFile, envContent);
    console.log(`Successfully wrote to ${targetPath}`);
} catch (err) {
    console.error(`Error writing to ${targetPath}:`, err);
    process.exit(1);
}
