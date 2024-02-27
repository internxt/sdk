import { SharingMeta } from '../share/types';

export interface DriveFolderData {
  id: number;
  bucket: string | null;
  color: string | null;
  createdAt: string;
  deleted: boolean;
  encrypt_version: string | null;
  icon: string | null;
  iconId: number | null;
  icon_id: number | null;
  name: string;
  plain_name: string;
  parentId: number | null;
  parent_id: number | null;
  updatedAt: string;
  userId: number;
  user_id: number;
}

export interface DriveFileData {
  uuid: string;
  bucket: string;
  createdAt: string;
  created_at: string;
  deleted: boolean;
  deletedAt: null;
  encrypt_version: string;
  fileId: string;
  folderId: number;
  folder_id: number;
  id: number;
  name: string;
  plain_name: string;
  size: number;
  type: string;
  updatedAt: string;
  status: string;
  thumbnails: Array<Thumbnail>;
  currentThumbnail: Thumbnail | null;
}

export interface Thumbnail {
  id: number;
  file_id: number;
  max_width: number;
  max_height: number;
  type: string;
  size: number;
  bucket_id: string;
  bucket_file: string;
  encrypt_version: string;
  urlObject?: string;
}

export interface FolderChild {
  bucket: string;
  color: string;
  createdAt: string;
  encrypt_version: string;
  icon: string;
  iconId: number | null;
  icon_id: number | null;
  id: number;
  name: string;
  plain_name: string;
  parentId: number;
  parent_id: number;
  updatedAt: string;
  userId: number;
  user_id: number;
  uuid: string;
}

export interface FetchFolderContentResponse {
  bucket: string;
  children: FolderChild[];
  color: string;
  createdAt: string;
  encrypt_version: string;
  files: DriveFileData[];
  icon: string;
  id: number;
  name: string;
  plain_name: string;
  parentId: number;
  parent_id: number;
  updatedAt: string;
  userId: number;
  user_id: number;
}

export interface FileMeta {
  bucket: string;
  createdAt: string;
  created_at: string;
  deleted: boolean;
  deletedAt: null;
  encrypt_version: string;
  fileId: string;
  folderId: number;
  folder_id: number;
  id: number;
  name: string;
  plain_name: string | null;
  plainName?: string | null;
  size: number;
  type: string;
  updatedAt: string;
  status: string;
  thumbnails: Array<Thumbnail>;
  currentThumbnail: Thumbnail | null;
  shares?: Array<ShareLink>;
  uuid?: string;
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

export interface FetchPaginatedFolderContentResponse {
  result: {
    bucket: string;
    children: FolderChild[];
    color: string;
    createdAt: string;
    encrypt_version: string;
    files: DriveFileData[];
    icon: string;
    id: number;
    name: string;
    plain_name: string;
    parentId: number;
    parent_id: number;
    updatedAt: string;
    userId: number;
    user_id: number;
    type: string;
  }[];
}

export enum FileStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  DELETED = 'DELETED',
}

export interface FetchPaginatedFile {
  id: number;
  uuid: string;
  fileId: string;
  name: string;
  type: string;
  size: bigint;
  bucket: string;
  folderId: number;
  folder?: any;
  folderUuid: string;
  encryptVersion: string;
  deleted: boolean;
  deletedAt: Date | null;
  removed: boolean;
  removedAt: Date | null;
  userId: number;
  user?: any;
  modificationTime: Date;
  plainName: string;
  createdAt: Date;
  updatedAt: Date;
  status: FileStatus;
  shares?: ShareLink[];
  thumbnails?: Thumbnail[];
  sharings?: SharingMeta[];
}

export interface FetchPaginatedFolder {
  id: number;
  parentId: number;
  parentUuid: string;
  parent?: any;
  name: string;
  bucket: string;
  userId: number;
  uuid: string;
  user?: any;
  plainName: string;
  encryptVersion: string;
  deleted: boolean;
  removed: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  removedAt: Date | null;
  sharings?: SharingMeta[];
}

export interface FetchPaginatedFilesContent {
  files: FetchPaginatedFile[];
}

export interface FetchPaginatedFoldersContent {
  folders: FetchPaginatedFolder[];
}

export interface FetchTrashContentResponse {
  result: {
    id: number;
    fileId: string;
    folderId: number;
    folder: string | null;
    name: string;
    type: string;
    size: string;
    bucket: string;
    encryptVersion: string;
    deleted: boolean;
    deletedAt: Date;
    userId: number;
    user: string | null;
    modificationTime: Date;
    createdAt: Date;
    updatedAt: Date;
    folderUuid: string | null;
    uuid: string;
    plainName: string;
  }[];
}

export enum EncryptionVersion {
  Aes03 = '03-aes',
}

export interface FileEntry {
  id: string;
  type: string;
  size: number;
  name: string;
  plain_name: string;
  bucket: string;
  folder_id: number;
  encrypt_version: EncryptionVersion;
}

export interface ThumbnailEntry {
  file_id: number;
  max_width: number;
  max_height: number;
  type: string;
  size: number;
  bucket_id: string;
  bucket_file: string;
  encrypt_version: EncryptionVersion;
}

export interface CreateFolderPayload {
  parentFolderId: number;
  folderName: string;
}

export interface CreateFolderResponse {
  bucket: string;
  id: number;
  name: string;
  plain_name: string;
  parentId: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface MoveFolderPayload {
  folderId: number;
  destinationFolderId: number;
}

export interface MoveFolderResponse {
  item: DriveFolderData;
  destination: number;
  moved: boolean;
}

export interface UpdateFolderMetadataPayload {
  folderId: number;
  changes: {
    itemName?: string;
    color?: string;
    icon?: string;
  };
}

// Files

export interface UpdateFilePayload {
  fileId: string;
  bucketId: string;
  destinationPath: string;
  metadata: {
    itemName?: string;
  };
}

export interface DeleteFilePayload {
  fileId: number;
  folderId: number;
}

export interface MoveFilePayload {
  fileId: string;
  destination: number;
  destinationPath: string;
  bucketId: string;
}

export interface MoveFileResponse {
  item: DriveFileData;
  destination: number;
  moved: boolean;
}

export type UsageResponse = {
  _id: string;
} & {
    [k in 'drive' | 'backups' | 'total']: number;
  };

export interface FetchLimitResponse {
  maxSpaceBytes: number;
}

export interface AddItemsToTrashPayload {
  items: Array<{ id: string; type: string }>;
}

export interface SearchResult {
  id: string;
  itemId: string;
  itemType: string;
  name: string;
  rank: number;
  similarity: number;
  userId: string;
  item: {
    id: number;
    bucket?: string;
    fileId?: string;
    plainName?: string;
    size?: string;
    type?: string;
  };
}
export interface SearchResultData {
  data: [SearchResult];
}

export interface FolderAncestor {
  bucket: null | string;
  createdAt: string;
  deleted: boolean;
  deletedAt: null | string;
  encryptVersion: null | string;
  id: number;
  name: string;
  parent: null | string;
  parentId: number;
  plainName: string;
  removed: boolean;
  removedAt: null | string;
  size: number;
  type: string;
  updatedAt: string;
  user: null | string;
  userId: number;
  uuid: string;
}
export interface FolderMeta {
  bucket: null | string;
  createdAt: string;
  deleted: boolean;
  deletedAt: null | string;
  encryptVersion: null | string;
  id: number;
  name: string;
  parent: null | string;
  parentId: number;
  plainName: string;
  removed: boolean;
  removedAt: null | string;
  size: number;
  type: string;
  updatedAt: string;
  user: null | string;
  userId: number;
  uuid: string;
}

export interface ReplaceFile {
  fileId: string;
  size: number;
}
