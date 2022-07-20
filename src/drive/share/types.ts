export interface GenerateShareLinkPayload {
  itemId: string
  type: string
  encryptionKey?: string
  mnemonic: string
  itemToken: string
  bucket: string
  timesValid: number
  code?: string
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
  user: any,
  item: any,
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