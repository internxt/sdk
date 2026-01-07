import { UUID, UserSettings } from '../../shared/types/userSettings';

export interface UserResumeData {
  avatar: string | null;
  email: string;
  lastname: string | null;
  name: string;
  uuid: string;
}

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
  keys?: {
    ecc: string;
    kyber: string;
  };
  user: { uuid: UUID; email: string };
};

export type FriendInvite = { guestEmail: string; host: number; accepted: boolean; id: number };

export type UserPublicKeyResponse = { publicKey: string; keys?: { ecc: string; kyber: string } };

export type UserPublicKeyWithCreationResponse = { publicKey: string; publicKyberKey: string | undefined };

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
export interface IncompleteCheckoutPayload extends Record<string, unknown> {
  completeCheckoutUrl: string;
  planName?: string;
  price?: number;
}

export interface IncompleteCheckoutResponse {
  success: boolean;
  message: string;
}
