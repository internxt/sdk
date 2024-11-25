import { UUID, UserSettings } from '../shared/types/userSettings';

export type Password = string;
export type Email = string;

export type Token = string;

export interface LoginDetails {
  email: Email;
  password: Password;
  tfaCode: string | undefined;
}

export interface RegisterDetails {
  name: string;
  lastname: string;
  email: Email;
  password: Password;
  mnemonic: string;
  salt: string;
  keys: Keys;
  captcha: string;
  referrer?: string;
  referral?: string;
}

export interface RegisterPreCreatedUser extends RegisterDetails {
  invitationId: string;
}
export interface RegisterPreCreatedUserResponse {
  token: Token;
  user: UserSettings & { referralCode: string };
  uuid: UUID;
}
export interface Keys {
  /**
  / @deprecated The individual fields for keys should not be used
  */
  privateKeyEncrypted: string;
  publicKey: string;
  revocationCertificate: string;
  ecc: {
    privateKeyEncrypted: string;
    publicKey: string;
  };
  kyber: {
    publicKey: string | null;
    privateKeyEncrypted: string | null;
  };
}

export interface CryptoProvider {
  encryptPasswordHash: (password: Password, encryptedSalt: string) => Promise<string>;
  generateKeys: (password: Password) => Promise<Keys>;
}

export class UserAccessError extends Error {}

export interface SecurityDetails {
  encryptedSalt: string;
  tfaEnabled: boolean;
}

export interface TwoFactorAuthQR {
  qr: string;
  backupKey: string;
}

export interface BasicAuth {
  username: string;
  password: string;
}
