import { FolderChild } from '../storage/types';

export interface GenerateShareLinkPayload {
  itemId: string;
  type: string;
  encryptedMnemonic: string;
  itemToken: string;
  bucket: string;
  timesValid: number;
  encryptedCode: string;
  plainPassword?: string;
}

export interface UpdateShareLinkPayload {
  itemId: string;
  plainPassword: string | null;
}

export interface GetSharedDirectoryPayload {
  type: string;
  token: string;
  folderId: number;
  parentId: number;
  page: number;
  perPage: number;
  code?: string;
  password?: string;
}

export interface GetShareLinkFolderSizePayload {
  itemId: string;
  folderId: string;
}
export interface ShareLink {
  id: string;
  token: string;
  mnemonic: string;
  user: any;
  item: any;
  encryptionKey: string;
  bucket: string;
  itemToken: string;
  isFolder: boolean;
  views: number;
  timesValid: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
  hashed_password: string | null;
  code: string;
}

export interface SharedDirectoryFolders {
  folders: SharedDirectoryFolder[];
  last: boolean;
}

export interface SharedDirectoryFolder {
  id: number;
  name: string;
}

export interface SharedDirectoryFiles {
  files: SharedDirectoryFile[];
  last: boolean;
}

export interface SharedDirectoryFile {
  id: string;
  name: string;
  type: string;
  size: number;
  encryptionKey: string;
}

export interface ShareDomainsResponse {
  list: string[];
}

export type ListShareLinksItem = Pick<
  ShareLink,
  'id' | 'token' | 'views' | 'timesValid' | 'active' | 'isFolder' | 'createdAt' | 'updatedAt' | 'fileSize'
> & {
  item: unknown;
};
export type ListShareLinksResponse = {
  items: ListShareLinksItem[];
  pagination: { page: number; perPage: number; countAll: number; orderBy?: string };
};

export type ListPrivateSharedFoldersResponse = {
  folders: FolderChild[];
};

export type SharedFolders = {
  bucket: string | null;
  createdAt: string;
  dateShared: string;
  deleted: boolean;
  deletedAt: string | null;
  encryptVersion: string;
  encryptionKey: string;
  id: number;
  name: string;
  parent: { id: string; size: number; type: string; uuid: string } | null;
  parentId: number;
  plainName: string;
  removed: boolean;
  removedAt: string | null;
  sharedWithMe: boolean;
  size: number;
  type: string;
  updatedAt: string;
  user: { avatar: string | null; email: string; lastname: string; name: string; uuid: string };
  userId: number;
  uuid: string;
};

export type SharedFiles = {
  bucket: string | null;
  createdAt: string;
  deleted: boolean;
  deletedAt: string | null;
  encryptVersion: string;
  fileiId: number;
  folder: string | null;
  folderId: number;
  folderUuid: string;
  id: number;
  modificationTime: string;
  name: string;
  plainName: string;
  removed: boolean;
  removedAt: string | null;
  shares: [];
  size: string;
  status: string;
  thumbnails: [];
  type: string;
  updatedAt: string;
  userId: number;
  uuid: string;
};

export type ListSharedItemsResponse = {
  credentials: { networkPass: string; networkUser: string };
  items: SharedFiles[] | SharedFolders[];
  token: string;
};

export type ListAllSharedFoldersResponse = {
  credentials: { networkPass: string; networkUser: string };
  files: SharedFiles[];
  folders: SharedFolders[];
  token: string;
};

export type ShareFolderWithUserPayload = {
  itemId: string;
  itemType: 'folder' | 'file';
  notifyUser: boolean;
  notificationMessage?: string;
  sharedWith: string;
  encryptionKey?: string;
  encryptionAlgorithm?: string;
  roleId: string;
  persistPreviousSharing?: boolean;
};

export type CreateSharingPayload = {
  itemId: string;
  itemType: 'folder' | 'file';
  encryptionKey: string;
  encryptionAlgorithm: string;
  encryptedCode: string;
  persistPreviousSharing?: boolean;
  encryptedPassword?: string;
};

export type PublicSharedItemInfo = {
  plainName: string;
  size: number;
  type: string;
};

export type AcceptInvitationToSharedFolderPayload = {
  encryptionKey: string;
  encryptionAlgorithm: string;
};

export type PrivateSharingRole = { id: string; name: string; createdAt: Date; updatedAt: Date };

export type PrivateSharingRolesResponse = { roles: PrivateSharingRole[] };

export type GrantSharePrivilegesToUserResponse = { message: string };
export type UpdateUserRoleResponse = { message: string };

export type UpdateUserRolePayload = {
  sharingId: string;
  newRoleId: string;
};

export type RemoveUserRolePayload = {
  itemType: string;
  itemId: string;
  userId: string;
};

export type SharedFolderUser = {
  avatar: string | null;
  email: string;
  grantedFrom: string;
  grantedFromPlainName: string;
  id: number;
  lastname: string;
  name: string;
  roleId: string;
  roleName: string;
  uuid: string;
};

export type Role = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type getSharedFolderUsersResponse = { users: SharedFolderUser[] };

export type SharedFoldersInvitationsAsInvitedUserResponse = {
  createdAt: Date;
  encryptionAlgorithm: string;
  encryptionKey: string;
  id: string;
  invited: { avatar: string | null; email: string; lastname: string; name: string; uuid: string };
  item: ItemInvitation;
  itemId: string;
  itemType: string;
  roleId: string;
  sharedWith: string;
  type: string;
  updatedAt: Date;
};

type ItemInvitation = {
  bucket: string | null;
  createdAt: Date;
  deleted: boolean;
  deletedAt: Date | null;
  encryptVersion: string;
  id: number;
  name: string;
  parent: null;
  parentId: number;
  plainName: string;
  removed: boolean;
  removedAt: Date | null;
  size: number;
  type: string;
  updatedAt: Date;
  user: { avatar: string | null; email: string; lastname: string; name: string; uuid: string } | null;
  userId: number;
  uuid: string;
};

export type FolderUserInfo = {
  avatar: string | null;
  email: string;
  grantedFrom: string;
  grantedFromPlainName: string;
  id: number;
  lastname: string;
  name: string;
  roleId: string;
  roleName: string;
  uuid: string;
};

export type SharingInvitation = {
  id: number;
  userId: string;
  name: string;
  lastname: string;
  email: string;
  username: string;
  bridgeUser: string;
  password: string;
  mnemonic: string;
  rootFolderId: number;
  hKey: Buffer | string;
  secret_2FA: string;
  errorLoginCount: number;
  isEmailActivitySended: number;
  referralCode: string;
  referrer: string;
  syncDate: Date;
  uuid: string;
  lastResend: Date;
  credit: number;
  welcomePack: boolean;
  registerCompleted: boolean;
  backupsBucket: string;
  sharedWorkspace: boolean;
  tempKey: string;
  avatar: string;
};

export type SharingInvite = {
  id: string;
  itemId: string;
  itemType: 'file' | 'folder';
  sharedWith: string;
  encryptionKey: string;
  encryptionAlgorithm: string;
  type: 'SELF' | 'OWNER';
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SharingMeta = {
  id: string;
  itemId: string;
  itemType: 'file' | 'folder';
  ownerId: string;
  sharedWith: string;
  encryptionKey: string;
  encryptedCode: string;
  encryptedPassword: string | null;
  encryptionAlgorithm: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'public' | 'private';
  item: SharedFiles | SharedFolders;
  itemToken: string;
};

export type Sharing = { type: string; id: string };
