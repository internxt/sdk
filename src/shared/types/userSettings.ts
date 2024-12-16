import { AppSumoDetails } from './appsumo';

export type UUID = string;

export interface UserSettings {
  userId: string;
  uuid: UUID;
  email: string;
  name: string;
  lastname: string;
  username: string;
  bridgeUser: string;
  bucket: string;
  backupsBucket: string | null;
  root_folder_id: number;
  rootFolderId: string;
  rootFolderUuid: string | undefined;
  sharedWorkspace: boolean;
  credit: number;
  mnemonic: string;
  /**
  / @deprecated The individual fields for keys should not be used
  */
  privateKey: string;
  publicKey: string;
  revocationKey: string;
  teams?: boolean;
  appSumoDetails: AppSumoDetails | null;
  registerCompleted: boolean;
  hasReferralsProgram: boolean;
  createdAt: Date;
  avatar: string | null;
  emailVerified: boolean;
}
