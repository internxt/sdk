import { MoveFolderPayload } from '../../../../src/drive/storage/types';

export function randomMoveFolderPayload(): MoveFolderPayload {
  return {
    folderId: 1,
    destinationFolderId: 3,
  };
}
