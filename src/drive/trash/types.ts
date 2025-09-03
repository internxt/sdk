import { paths } from '../../schema';

export type AddItemsToTrashPayload = paths['/storage/trash/add']['post']['requestBody']['content']['application/json'];

export interface DeleteFilePayload {
  fileId: number;
  folderId: number;
}

export interface DeleteItemsPermanentlyPayload {
  items: Array<{ id: number; type: 'folder' } | { id: string; type: 'file' }>;
}

export interface DeleteItemsPermanentlyByUUIDPayload {
  items: Array<{ uuid: string; type: 'folder' } | { uuid: string; type: 'file' }>;
}
