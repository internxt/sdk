export type Password = string;
export type Email = string;

export interface LoginDetails {
  email: Email,
  password: Password,
  tfaCode: string | undefined
}

export interface RegisterDetails {
  name: string,
  lastname: string,
  email: Email,
  password: Password,
  mnemonic: string,
  salt: string,
  keys: Keys,
  captcha: string,
  referrer?: string,
  referral?: string,
}

export interface Keys {
  privateKeyEncrypted: string,
  publicKey: string,
  revocationCertificate: string
}

export interface CryptoProvider {
  encryptPasswordHash: (password: Password, encryptedSalt: string) => string,
  generateKeys: (password: Password) => Promise<Keys>,
}

export class UserAccessError extends Error {}
