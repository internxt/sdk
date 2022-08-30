export interface AddItemsToTrashPayload {
  items: Array<{ id: string; type: string }>;
}

export interface DeleteFilePayload {
  fileId: number;
  folderId: number;
}
