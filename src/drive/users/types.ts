import { UUID, UserSettings } from '../../shared/types/userSettings';

export type Token = string;

export interface InitializeUserResponse {
  email: string;
  bucket: string;
  mnemonic: string;
  root_folder_id: number;
}

export interface ChangePasswordPayload {
  currentEncryptedPassword: string;
  newEncryptedPassword: string;
  newEncryptedSalt: string;
  encryptedMnemonic: string;
  encryptedPrivateKey: string;
}

export interface ChangePasswordPayloadNew {
  currentEncryptedPassword: string;
  newEncryptedPassword: string;
  newEncryptedSalt: string;
  encryptedMnemonic: string;
  /**
   * @deprecated encryptedPrivateKey field is depercated, use keys.encryptedPrivateKey instead
   */
  encryptedPrivateKey: string;
  keys: {
    encryptedPrivateKey: string;
    encryptedPrivateKyberKey: string;
  };
  encryptVersion: string;
}

export type UpdateProfilePayload = Partial<Pick<UserSettings, 'name' | 'lastname'>>;

export type PreCreateUserResponse = {
  publicKey: string;
  publicKyberKey?: string;
  user: { uuid: UUID; email: string };
};

export type FriendInvite = { guestEmail: string; host: number; accepted: boolean; id: number };

export type UserPublicKeyResponse = { publicKey: string; publicKyberKey?: string };

export type VerifyEmailChangeResponse = {
  oldEmail: string;
  newEmail: string;
  newAuthentication: {
    user: UserSettings;
    token: string;
    newToken: string;
  };
};

export type CheckChangeEmailExpirationResponse = { isExpired: boolean };
