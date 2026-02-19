import { env } from './env';

export const environment = {
  production: false, // or true in prod
  ...env,
};
