import { DriveFileData } from '../../../../src/drive/storage/types';

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
    updatedAt: ''
  };
}