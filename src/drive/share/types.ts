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

export type ListAllSharedFoldersResponse = {
  sharedByMe: FolderChild[];
  sharedWithMe: FolderChild[];
};

export type SharePrivateFolderWithUserPayload = {
  emailToShare: string;
  privateFolderId: FolderChild['uuid'];
  roleId: PrivateSharingRole['id'];
  encryptionKey: string;
};

export type PrivateSharingRole = { id: string; role: string; createdAt: Date; updatedAt: Date };

export type PrivateSharingRolesResponse = { roles: PrivateSharingRole[] };

export type GrantSharePrivilegesToUserResponse = { message: string };
export type UpdateRoleFolderResponse = { message: string };

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
  owner_id: string;
  shared_with: string;
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