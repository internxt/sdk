import { config as loadEnv } from 'dotenv';
import { Config } from './types';

loadEnv();

function loadConfig(): Config {
  const requiredVars = ['API_URL', 'AUTH_TOKEN', 'CLIENT_NAME', 'CLIENT_VERSION'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please ensure all required variables are set in your .env file',
    );
  }

  return {
    port: Number.parseInt(process.env.PORT ?? '7001'),
    apiUrl: process.env.API_URL!,
    authToken: process.env.AUTH_TOKEN!,
    clientName: process.env.CLIENT_NAME!,
    clientVersion: process.env.CLIENT_VERSION!,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

export const config = loadConfig();
