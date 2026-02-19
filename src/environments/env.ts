// src/environments/env.ts
export const env = {
  UNTAPPD_USERNAME: (window as any).__env?.UNTAPPD_USERNAME || '',
  DATA_URL: (window as any).__env?.DATA_URL || '/assets/',
  GA4_MEASUREMENT_ID: (window as any).__env?.GA4_MEASUREMENT_ID || '',
  S3_BUCKET_NAME: (window as any).__env?.S3_BUCKET_NAME || '',
  LAMBDA_ZIP_FILE: (window as any).__env?.LAMBDA_ZIP_FILE || '',
};
