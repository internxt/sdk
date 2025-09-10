import {
  DriveFileData,
  FetchFolderContentResponse,
  FetchPaginatedFilesContent,
  FetchPaginatedFoldersContent,
  FileStatus,
  FolderChild,
} from '../../../../src/drive/storage/types';

export function emptyFolderContentResponse(): FetchFolderContentResponse {
  const response: FetchFolderContentResponse = {
    type: 'folder',
    id: 0,
    parentId: null,
    parentUuid: null,
    name: '',
    parent: null,
    bucket: '',
    userId: 0,
    user: null,
    encryptVersion: '',
    deleted: false,
    deletedAt: null,
    createdAt: '',
    updatedAt: '',
    uuid: '',
    plainName: null,
    size: 0,
    removed: false,
    removedAt: null,
    creationTime: '',
    modificationTime: '',
    status: 'EXISTS',
    children: [],
    files: [],
  };
  return response;
}

export function randomFolderContentResponse(folderCount: number, fileCount: number) {
  const folderChild: FolderChild = {
    bucket: '',
    color: '',
    createdAt: '',
    encrypt_version: '',
    icon: '',
    iconId: null,
    icon_id: null,
    id: 0,
    name: '',
    plain_name: '',
    parentId: 0,
    parent_id: 0,
    updatedAt: '',
    userId: 0,
    user_id: 0,
    uuid: '',
  };
  const file: DriveFileData = {
    uuid: '',
    bucket: '',
    createdAt: '',
    created_at: '',
    deleted: false,
    deletedAt: null,
    encrypt_version: '',
    fileId: '',
    folderUuid: '',
    folderId: 0,
    folder_id: 0,
    id: 0,
    name: '',
    plain_name: '',
    size: 0,
    type: '',
    updatedAt: '',
    status: '',
    thumbnails: [],
    currentThumbnail: null,
  };

  const response = emptyFolderContentResponse();

  for (let i = 0; i < folderCount; i++) {
    response.children.push(folderChild);
  }

  for (let i = 0; i < fileCount; i++) {
    response.files.push(file);
  }

  return response;
}

export function randomSubfilesResponse(fileCount: number) {
  const responseFiles: FetchPaginatedFilesContent = { files: [] };

  for (let i = 0; i < fileCount; i++) {
    responseFiles.files.push({
      id: i,
      uuid: '',
      fileId: '',
      name: '',
      type: '',
      size: '0',
      bucket: '',
      folderId: 0,
      folderUuid: '',
      encryptVersion: '',
      userId: 0,
      creationTime: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      plainName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: FileStatus.EXISTS,
    });
  }
  return responseFiles;
}

export function randomSubfoldersResponse(fileCount: number) {
  const responseFolders: FetchPaginatedFoldersContent = { folders: [] };

  for (let i = 0; i < fileCount; i++) {
    responseFolders.folders.push({
      id: i,
      parentId: 0,
      parentUuid: '',
      name: '',
      bucket: '',
      userId: 0,
      uuid: '',
      plainName: '',
      encryptVersion: '',
      deleted: false,
      removed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creationTime: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      parent: {},
      size: 0,
      status: 'EXISTS',
      type: 'any',
    });
  }
  return responseFolders;
}
