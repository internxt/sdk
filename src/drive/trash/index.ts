import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { AddItemsToTrashPayload, DeleteFilePayload, DeleteItemsPermanentlyPayload } from './types';
import { FetchFolderContentResponse, FetchTrashContentResponse } from '../storage/types';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { HttpClient } from '../../shared/http/client';

export * as TrashTypes from './types';

export class Trash {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Trash(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Removes a specific folder from the centralized persistence
   * @param folderId
   */
  public async deleteFolder(folderId: number): Promise<unknown> {
    return this.client.delete(`/storage/folder/${folderId}`, this.headers());
  }

  /**
   * Deletes a specific file entry
   * @param payload
   */
  public async deleteFile(payload: DeleteFilePayload): Promise<unknown> {
    return this.client.delete(`/storage/folder/${payload.folderId}/file/${payload.fileId}`, this.headers());
  }

  /**
   * Returns a list of items in trash
   */
  public getTrash(): Promise<FetchFolderContentResponse> {
    return this.client.get('/storage/trash', this.headers());
  }

  /**
   * Retrieves a paginated list of trashed files or folders.
   * @param {number} limit - The number of items to retrieve per page.
   * @param {number} [offset=0] - The number of items to skip before beginning to return items.
   * @param {'files' | 'folders'} type - The type of content to retrieve.
   * @param {boolean} root - A boolean indicating whether to retrieve content from the root folder.
   * If is not true it has to get a folderId in order to obtain the items or given folderId
   * @param {number} [folderId] - The ID of the folder to retrieve content from.
   * @returns {Promise<FetchTrashContentResponse>} - A promise that resolves with the paginated list of trashed content.
   */
  public getTrashedFilesPaginated(
    limit: number,
    offset = 0,
    type: 'files' | 'folders',
    root: boolean,
    folderId?: number,
  ): Promise<FetchTrashContentResponse> {
    const endpoint = '/storage/trash/paginated';
    const folderIdQuery = folderId !== undefined ? `folderId=${folderId}&` : '';

    const url = `${endpoint}?${folderIdQuery}limit=${limit}&offset=${offset}&type=${type}&root=${root}`;

    return this.client.get(url, this.headers());
  }

  /**
   * Add Items to Trash
   * @param payload
   */
  public addItemsToTrash(payload: AddItemsToTrashPayload) {
    return this.client.post(
      '/storage/trash/add',
      {
        items: payload.items,
      },
      this.headers(),
    );
  }

  /**
   * Removes all items from the trash
   */
  public clearTrash(): Promise<void> {
    return this.client.delete('/storage/trash/all', this.headers());
  }

  /**
   * Deletes trashed items permanently
   * @param payload
   */
  public deleteItemsPermanently(payload: DeleteItemsPermanentlyPayload) {
    return this.client.delete('/storage/trash', this.headers(), {
      items: payload.items,
    });
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithTokenAndMnemonic(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      this.apiSecurity.mnemonic,
    );
  }
}
