import * as dotenv from 'dotenv';
import * as path from 'path';

// Only load .env if running locally (not on Netlify)
if (!process.env.NETLIFY) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export const env = {
  UNTAPPD_USERNAME: process.env.UNTAPPD_USERNAME!,
  DATA_URL: process.env.DATA_URL!,
  GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID!,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME!,
  LAMBDA_ZIP_FILE: process.env.LAMBDA_ZIP_FILE!,
};
