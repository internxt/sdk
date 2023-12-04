import { UUID, UserSettings } from '../../shared/types/userSettings';

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

export type UpdateProfilePayload = Partial<Pick<UserSettings, 'name' | 'lastname'>>;

export type PreCreateUserResponse = {
  publicKey: string;
  user: { uuid: UUID; email: string };
};

export type FriendInvite = { guestEmail: string; host: number; accepted: boolean; id: number };

export type UserPublicKeyResponse = { publicKey: string };
