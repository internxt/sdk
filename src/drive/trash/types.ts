export interface AddItemsToTrashPayload {
  items: Array<{ id?: string; uuid?: string; type: string }>;
}

export interface DeleteFilePayload {
  fileId: number;
  folderId: number;
}

export interface DeleteItemsPermanentlyPayload {
  items: Array<{ uuid: string; type: 'folder' } | { uuid: string; type: 'file' }>;
}
