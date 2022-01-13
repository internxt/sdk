import { UpdateFolderMetadataPayload } from '../../../../src/drive/storage/types';


export function randomUpdateFolderMetadataPayload(): UpdateFolderMetadataPayload {
  return {
    folderId: 2,
    changes: {
      itemName: 'new name',
      color: 'new color',
      icon: 'new icon',
    },
  };
}