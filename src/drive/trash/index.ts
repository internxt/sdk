import { paths } from '../../schema';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithToken } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { FetchFolderContentResponse, FetchTrashContentResponse } from '../storage/types';
import { DeleteFilePayload, DeleteItemsPermanentlyByUUIDPayload, DeleteItemsPermanentlyPayload } from './types';

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
   * Retrieves a sorted list of trashed files or folders.
   * @param {number} limit - The number of items to retrieve per page.
   * @param {number} [offset=0] - The number of items to skip before beginning to return items.
   * @param {'files' | 'folders'} type - The type of content to retrieve.
   * @param {boolean} root - A boolean indicating whether to retrieve content from the root folder.
   * If is not true it has to get a folderId in order to obtain the items or given folderId
   * @param {'plainName' | 'date'} [sort] - The ID of the folder to retrieve content from.
   * @param {'ASC' | 'DESC'} [order] - The ID of the folder to retrieve content from.
   * @param {number} [folderId] - The ID of the folder to retrieve content from.
   * @returns {Promise<FetchTrashContentResponse>} - A promise that resolves with the paginated list of trashed content.
   */
  public getTrashedItemsSorted(
    limit: number,
    offset = 0,
    type: 'files' | 'folders',
    root: boolean,
    sort: 'plainName' | 'updatedAt',
    order: 'ASC' | 'DESC',
    folderId?: number,
  ): Promise<FetchTrashContentResponse> {
    const endpoint = '/storage/trash/paginated';
    const folderIdQuery = folderId !== undefined ? `folderId=${folderId}&` : '';
    const params = `limit=${limit}&offset=${offset}&type=${type}&root=${root}&sort=${sort}&order=${order}`;

    const url = `${endpoint}?${folderIdQuery}${params}`;

    return this.client.get(url, this.headers());
  }

  /**
   * Add Items to Trash
   * @param payload
   */
  public addItemsToTrash(
    payload: paths['/storage/trash/add']['post']['requestBody']['content']['application/json'],
  ): Promise<void> {
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
   * Deletes trashed items permanently by UUID.
   *
   * @param {DeleteItemsPermanentlyByUUIDPayload} payload - The payload containing the items to be deleted.
   * @return {Promise<void>} A promise that resolves when the items are deleted permanently.
   */
  public deleteItemsPermanentlyByUUID(payload: DeleteItemsPermanentlyByUUIDPayload) {
    return this.client.delete('/storage/trash', this.headers(), {
      items: payload.items,
    });
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: this.apiSecurity.token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
