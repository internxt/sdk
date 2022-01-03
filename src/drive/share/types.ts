
export interface GenerateShareLinkPayload {
  fileId: string
  isFolder: boolean
  views: number
  encryptionKey: string
  fileToken: string
  bucket: string
}

export interface GetShareInfoResponse {
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