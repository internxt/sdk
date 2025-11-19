import { Auth, CryptoProvider, Keys } from '../../../src/auth';
import { config } from '../config';
import { passToHash, encryptText, decryptText } from './crypto';

let authClientInstance: Auth | null = null;

export function getAuthClient(): Auth {
  authClientInstance ??= Auth.client(config.apiUrl, {
    clientName: config.clientName,
    clientVersion: config.clientVersion,
  });
  return authClientInstance;
}

export const cryptoProvider: CryptoProvider = {
  encryptPasswordHash(password: string, encryptedSalt: string): string {
    const salt = decryptText(encryptedSalt);
    const hashObj = passToHash({ password, salt });
    return encryptText(hashObj.hash);
  },
  async generateKeys(_password: string): Promise<Keys> {
    // required by interface
    throw new Error('Key generation not supported in health check');
  },
};
