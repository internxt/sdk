export interface SendItemBasic {
  id: string;
  name: string;
  size: number;
  type: 'file' | 'folder';
  parent_folder: string | null;
}

export interface SendItem extends SendItemBasic {
  linkId: string;
  networkId: string;
  encryptionKey: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  path?: string;
  countFiles?: number;
  childrenFiles?: SendItem[];
  childrenFolders?: SendItem[];
}

export interface GetSendLinkResponse {
  id: string;
  title: string;
  subject: string;
  code: string;
  views: number;
  userId: number | null;
  items: SendItem[];
  createdAt: string;
  updatedAt: string;
  expirationAt: string;
  size: number;
}

export interface SendLink extends SendItemBasic {
  networkId: string;
  encryptionKey: string;
}

export interface CreateSendLinksPayload {
  sender?: string;
  receivers?: string[];
  code: string;
  title?: string;
  subject?: string;
  items: SendLink[];
  mnemonic: string;
}

export interface CreateSendLinksResponse {
  id: string;
  title: string;
  subject: string;
  code: string;
  sender: string;
  receivers: string[];
  views: number;
  userId: number;
  items: SendLink[];
  createdAt: string;
  updatedAt: string;
  expirationAt: string;
}
