export interface DriveFolderData {
  id: number;
  bucket: string | null;
  color: string | null;
  createdAt: string;
  encrypt_version: string | null;
  icon: string | null;
  iconId: number | null;
  icon_id: number | null;
  isFolder: boolean;
  name: string;
  parentId: number;
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

export interface FileEntry {
  id: string,
  type: string,
  size: number,
  name: string,
  bucket: string,
  folder_id: number,
  encrypt_version: string,
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
  folder: DriveFolderData
  destinationFolderId: number
}

export interface MoveFolderResponse {
  item: DriveFolderData;
  destination: number;
  moved: boolean;
}

export interface UpdateFolderMetadataPayload {
  folderId: number,
  changes: {
    itemName?: string;
    color?: string;
    icon?: string;
  }
}

// Files

export interface UpdateFilePayload {
  fileId: string,
  bucketId: string,
  destinationPath: string,
  metadata: {
    itemName?: string;
  },
}

export interface DeleteFilePayload {
  fileId: number,
  folderId: number,
}

export interface MoveFilePayload {
  fileId: string
  destination: number
  destinationPath: string
  bucketId: string
}

export interface MoveFileResponse {
  item: DriveFileData
  destination: number
  moved: boolean
}