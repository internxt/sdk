import { UserSettings } from '../../shared/types/userSettings';

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
  encryptVersion: string;
}

export type UpdateProfilePayload = Partial<Pick<UserSettings, 'name' | 'lastname'>>;

export type FriendInvite = { guestEmail: string; host: number; accepted: boolean; id: number };
