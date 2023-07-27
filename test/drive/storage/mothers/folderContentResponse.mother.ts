import { DriveFileData, FetchFolderContentResponse, FolderChild } from '../../../../src/drive/storage/types';

export function emptyFolderContentResponse() {
  const response: FetchFolderContentResponse = {
    bucket: '',
    children: [],
    color: '',
    createdAt: '',
    encrypt_version: '',
    files: [],
    icon: '',
    id: 0,
    name: '',
    plain_name: '',
    parentId: 0,
    parent_id: 0,
    updatedAt: '',
    userId: 0,
    user_id: 0,
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
    bucket: '',
    createdAt: '',
    created_at: '',
    deleted: false,
    deletedAt: null,
    encrypt_version: '',
    fileId: '',
    folderId: 0,
    folder_id: 0,
    id: 0,
    name: '',
    plain_name: '',
    size: 0,
    type: '',
    updatedAt: '',
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
