export interface GenerateShareLinkPayload {
  itemId: string
  type: string
  encryptionKey: string
  mnemonic: string
  itemToken: string
  bucket: string
  timesValid: number
}

export interface UpdateShareLinkPayload {
  itemId: string
  timesValid: number
  active: boolean
}

export interface GetSharedDirectoryPayload {
  type: string
  token: string
  folderId: number | null
  page: number
  perPage: number
  code?: string
}

export interface GetShareLinkFolderSizePayload {
  itemId: string
  folderId: string
}
export interface ShareLink {
  id: string,
  token: string,
  mnemonic: string,
  user: object | null,
  item: object | null,
  encryptionKey: string,
  bucket: string,
  itemToken: string,
  isFolder: boolean,
  views: number,
  timesValid: number,
  active: boolean,
  createdAt: string,
  updatedAt: string,
}
export interface SharedFileInfo {
  user: string;
  token: string;
  file: string;
  encryptionKey: string;
  mnemonic: string;
  isFolder: boolean;
  views: number;
  bucket: string;
  fileToken: string;
  fileMeta: {
    folderId: string;
    name: string;
    type: string;
    size: number;
  };
}

export interface SharedDirectoryFolders {
  folders: SharedDirectoryFolder[],
  last: boolean
}

export interface SharedDirectoryFolder {
  id: number
  name: string
}

export interface SharedDirectoryFiles {
  files: SharedDirectoryFile[],
  last: boolean
}

export interface SharedDirectoryFile {
  id: string
  name: string
  type: string
  size: number
  encryptionKey: string
}

export interface IFile {
  bucket: string
  createdAt: Date
  folderId: number
  fileId: string
  id: number
  name: string
  type: string
  updatedAt: Date
  size: number
  progress: number
  uri?: string
  isUploaded?: boolean
}