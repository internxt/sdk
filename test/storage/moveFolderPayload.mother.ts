import { DriveFolderData, MoveFolderPayload } from '../../src/drive/storage/types';

export function randomMoveFolderPayload(): MoveFolderPayload {
  return {
    folder: <DriveFolderData>{
      id: 1,
      bucket: 'bucket',
      color: 'red',
      createdAt: '',
      encrypt_version: '',
      icon: '',
      iconId: 1,
      icon_id: 1,
      isFolder: true,
      name: 'name',
      parentId: 1,
      parent_id: 1,
      updatedAt: '',
      userId: 1,
      user_id: 1,
    },
    destinationFolderId: 3,
    destinationPath: '',
    bucketId: '',
  };
}