import dotenv from 'dotenv';

dotenv.config();

const config = {
  apiAuthToken: process.env.API_AUTH_TOKEN,
  port: process.env.HEALTH_CHECK_PORT || 3000,
  cryptoSecret: process.env.CRYPTO_SECRET || '',
  drive: {
    apiBaseUrl: process.env.DRIVE_API_BASE_URL,
    driveUserAccount: process.env.DRIVE_USER_ACCOUNT,
    driveUserPassword: process.env.DRIVE_USER_PASSWORD,
  },
};

export default config;
