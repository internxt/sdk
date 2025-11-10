import { Auth, CryptoProvider, Keys } from '../../../src/auth';
import { config } from '../config';
import { passToHash, encryptText, decryptText } from './crypto';
import { getKeys } from './keys';

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
  async generateKeys(password: string): Promise<Keys> {
    return getKeys(password);
  },
};
