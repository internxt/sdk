import { UUID, UserSettings } from '../shared/types/userSettings';

export type Password = string;
export type Email = string;

export type Token = string;

export interface LoginDetails {
  email: Email;
  password: Password;
  tfaCode: string | undefined;
}

export type UserKeys = {
  privateKey: string;
  publicKey: string;
  privateKyberKey: string;
  publicKyberKey: string;
};

export interface RegisterOpaqueDetails {
  name: string;
  lastname: string;
  email: Email;
  encMnemonic: string;
  encKeys: UserKeys;
  captcha: string;
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
  newToken: Token;
  user: UserSettings & { referralCode: string };
  uuid: UUID;
}
export interface Keys {
  privateKeyEncrypted: string;
  publicKey: string;
  revocationCertificate: string;
  ecc: {
    publicKey: string;
    privateKeyEncrypted: string;
  };
  kyber: {
    publicKey: string | null;
    privateKeyEncrypted: string | null;
  };
}

export interface CryptoProvider {
  encryptPasswordHash: (password: Password, encryptedSalt: string) => string;
  generateKeys: (password: Password) => Promise<Keys>;
}

export class UserAccessError extends Error {}

export interface SecurityDetails {
  encryptedSalt: string;
  tfaEnabled: boolean;
  opaqueLogin: boolean;
}

export interface TwoFactorAuthQR {
  qr: string;
  backupKey: string;
}

export interface BasicAuth {
  username: string;
  password: string;
}

export interface PrivateKeys {
  ecc?: string;
  kyber?: string;
}

export interface PrivateKeysExtended {
  ecc: {
    public: string;
    private: string;
    revocationKey: string;
  };
  kyber: {
    public: string;
    private: string;
  };
}

export interface ChangePasswordWithLinkPayload {
  token: string;
  encryptedPassword: string;
  encryptedSalt: string;
  encryptedMnemonic: string;
  eccEncryptedMnemonic?: string;
  kyberEncryptedMnemonic?: string;
  keys: PrivateKeysExtended;
}
