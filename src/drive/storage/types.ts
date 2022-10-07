export interface DriveFolderData {
  id: number;
  bucket: string | null;
  color: string | null;
  createdAt: string;
  encrypt_version: string | null;
  icon: string | null;
  iconId: number | null;
  icon_id: number | null;
  name: string;
  parentId: number | null;
  parent_id: number | null;
  updatedAt: string;
  userId: number;
  user_id: number;
}

export interface DriveFileData {
  bucket: string;
  createdAt: string;
  created_at: string;
  deleted: false;
  deletedAt: null;
  encrypt_version: string;
  fileId: string;
  folderId: number;
  folder_id: number;
  id: number;
  name: string;
  size: number;
  type: string;
  updatedAt: string;
  thumbnails: Array<Thumbnail>;
  currentThumbnail: string;
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
  parentId: number;
  parent_id: number;
  updatedAt: string;
  userId: number;
  user_id: number;
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
  parentId: number;
  parent_id: number;
  updatedAt: string;
  userId: number;
  user_id: number;
}

export enum EncryptionVersion {
  Aes03 = '03-aes',
}

export interface FileEntry {
  id: string;
  type: string;
  size: number;
  name: string;
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
  items: Array<{id: string, type: string}>;
}