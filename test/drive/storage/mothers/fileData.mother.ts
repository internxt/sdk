import { DriveFileData, FileMeta } from '../../../../src/drive/storage/types';

export function randomFileData(): DriveFileData {
  return <DriveFileData>{
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
    size: 0,
    type: '',
    updatedAt: '',
  };
}

export function randomFileMetaData(): FileMeta {
  return {
    bucket: '',
    createdAt: '',
    creationTime: '',
    encryptVersion: '',
    fileId: '',
    folderId: 0,
    folderUuid: '',
    id: 0,
    modificationTime: '',
    name: '',
    plainName: '',
    size: '',
    status: 'EXISTS',
    type: '',
    updatedAt: '',
    uuid: '',
    userId: 0,
  };
}
