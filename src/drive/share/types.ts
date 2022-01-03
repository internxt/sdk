
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