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
  sharedWith: string;
  encryptionKey?: string;
  encryptionAlgorithm?: string;
  roleId: string;
};

export type AcceptInviteToSharedFolderPayload = {
  encryptionKey: string;
  encryptionAlgorithm: string;
};

export type PrivateSharingRole = { id: string; name: string; createdAt: Date; updatedAt: Date };

export type PrivateSharingRolesResponse = { roles: PrivateSharingRole[] };

export type GrantSharePrivilegesToUserResponse = { message: string };
export type UpdateUserRoleResponse = { message: string };

export type UpdateUserRolePayload = {
  folderUUID: string;
  roleId: string;
  newRoleId: string;
};

export type RemoveUserRolePayload = {
  folderUUID: string;
  roleId: string;
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

export type getSharedFolderUsersResponse = { users: SharedFolderUser[] };

export type PrivateSharedFolder = {
  id: string;
  folderId: string;
  ownerId: string;
  sharedWith: string;
  encryptionKey: string;
  createdAt: string;
  updatedAt: string;
  folder: {
    id: number;
    uuid: string;
    parentId: number;
    parentUuid: string | null;
    name: string;
    bucket: string | null;
    userId: number;
    encryptVersion: string;
    plainName: string | null;
    deleted: boolean;
    removed: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    removedAt: string | null;
  };
  owner: {
    uuid: string;
    email: string;
    name: string;
    lastname: string;
    avatar: string | null;
  };
  fileSize: number;
};
