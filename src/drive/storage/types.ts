import { paths } from '../../schema';
import { UserResumeData } from '../users/types';

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
  plainName?: string | null;
  parentId: number | null;
  parent_id: number | null;
  parentUuid: string;
  updatedAt: string;
  userId: number;
  user_id: number;
  uuid: string;
  user?: UserResumeData;
}

export interface DriveFileData {
  bucket: string;
  createdAt: string;
  created_at: string;
  deleted: boolean;
  deletedAt: null;
  encrypt_version: string;
  fileId: string;
  folderId: number;
  folder_id: number;
  folderUuid: string;
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
  sharings?: { type: string; id: string }[];
  uuid: string;
  user?: UserResumeData;
  creationTime?: string;
  modificationTime?: string;
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
  plainName?: string;
}

export interface FetchFolderContentResponse {
  type: string;
  id: number;
  parentId: number | null;
  parentUuid: string | null;
  name: string;
  parent: string | null;
  bucket: string;
  userId: number;
  user: any | null;
  encryptVersion: string;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  uuid: string;
  plainName: string | null;
  size: number;
  removed: boolean;
  removedAt: string | null;
  creationTime: string;
  modificationTime: string;
  status: string;
  children: FolderChild[];
  files: DriveFileData[];
}

export type FileMeta = paths['/files/{uuid}/meta']['get']['responses']['200']['content']['application/json'];

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

export type FetchPaginatedFile =
  paths['/folders/content/{uuid}/files']['get']['responses']['200']['content']['application/json']['files'][0];

export type FetchPaginatedFolder =
  paths['/folders/content/{uuid}/folders']['get']['responses']['200']['content']['application/json']['folders'][0];

export type FetchPaginatedFilesContent =
  paths['/folders/content/{uuid}/files']['get']['responses']['200']['content']['application/json'];

export type FetchPaginatedFoldersContent =
  paths['/folders/content/{uuid}/folders']['get']['responses']['200']['content']['application/json'];

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

export type FileEntryByUuid = paths['/files']['post']['requestBody']['content']['application/json'];

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

export interface CreateThumbnailEntryPayload {
  fileUuid: string;
  type: string;
  size: number;
  maxWidth: number;
  maxHeight: number;
  bucketId: string;
  bucketFile: string;
  encryptVersion: EncryptionVersion;
}

export interface CreateFolderPayload {
  parentFolderId: number;
  folderName: string;
}
export interface CreateFolderByUuidPayload {
  plainName: string;
  parentFolderUuid: string;
}

export interface CreateFolderResponse {
  id: number;
  parentId: number;
  parentUuid: string;
  name: string;
  bucket: string | null;
  userId: number;
  encryptVersion: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  uuid: string;
  plainName: string;
  removed: boolean;
  removedAt: Date | null;
  creationTime: Date;
  modificationTime: Date;
}

export interface MoveFolderPayload {
  folderId: number;
  destinationFolderId: number;
}

export type MoveFolderUuidPayload = paths['/folders/{uuid}']['patch']['requestBody']['content']['application/json'];

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

export type MoveFileUuidPayload = paths['/files/{uuid}']['patch']['requestBody']['content']['application/json'];

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

export type UsageResponseV2 = {
  drive: number;
  backups: number;
  total: number;
};

export interface FetchLimitResponse {
  maxSpaceBytes: number;
}

export type AddItemsToTrashPayload = paths['/storage/trash/add']['post']['requestBody']['content']['application/json'];

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
export interface FolderAncestorWorkspace {
  uuid: string;
  plainName: string;
}
export interface FolderMeta {
  id: number;
  uuid: string;
  name: string;
  plain_name: string;
  plainName: string;
  bucket: string | null;
  parent_id: number | null;
  parentId: number | null;
  parent_uuid: string | null;
  parentUuid: string | null;
  parent: string | null;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
  user: string | null;
  user_id: number;
  userId: number;
  encrypt_version: string | null;
  encryptVersion: string | null;
  deleted: boolean;
  deleted_at: string | null;
  deletedAt: string | null;
  removed: boolean;
  removed_at: string | null;
  removedAt: string | null;
  size: number;
  type: string;
  creation_time: string;
  modification_time: string;
}

export interface ReplaceFile {
  fileId: string;
  size: number;
}

export interface FolderTree {
  id: number;
  bucket: string | null;
  children: FolderTree[];
  encrypt_version: string;
  files: DriveFileData[];
  name: string;
  plainName: string;
  parentId: number;
  userId: number;
  uuid: string;
  parentUuid: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  type: string;
  deleted: boolean;
  removed: boolean;
}

export interface FolderTreeResponse {
  tree: FolderTree;
}

export interface CheckDuplicatedFilesPayload {
  folderUuid: string;
  filesList: FileStructure[];
}

export interface FileStructure {
  plainName: string;
  type: string;
}

export interface CheckDuplicatedFilesResponse {
  existentFiles: DriveFileData[];
}

export interface CheckDuplicatedFolderPayload {
  folderUuid: string;
  folderNamesList: string[];
}

export interface CheckDuplicatedFoldersResponse {
  existentFolders: DriveFolderData[];
}

export enum FileVersionStatus {
  EXISTS = 'EXISTS',
  DELETED = 'DELETED',
}

export interface FileVersion {
  id: string;
  fileId: string;
  networkFileId: string;
  size: bigint;
  status: FileVersionStatus;
  createdAt: Date;
  updatedAt: Date;
}