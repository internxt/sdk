export interface GenerateShareFileLinkPayload {
  fileId: string
  views: number
  encryptionKey: string
  fileToken: string
  bucket: string
}

export interface GenerateShareFolderLinkPayload {
  folderId: number
  views: number
  bucketToken: string
  bucket: string,
  encryptedMnemonic: string
}

export interface GetSharedDirectoryFoldersPayload {
  token: string
  directoryId: number | null
  offset: number
  limit: number
}

export interface GetSharedDirectoryFilesPayload extends GetSharedDirectoryFoldersPayload {
  code: string
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

export interface SharedFolderInfo {
  folderId: number
  name: string
  size: number
  bucket: string
  bucketToken: string
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

export interface IShare {
  token: string
  file: string
  encryptionKey: string
  bucket: string
  fileToken: string
  isFolder: boolean
  views: number
  fileInfo: IFile
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