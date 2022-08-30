import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { AddItemsToTrashPayload, DeleteFilePayload } from './types';
import { FetchFolderContentResponse } from '../storage/types';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { HttpClient, RequestCanceler } from '../../shared/http/client';

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
  public deleteFolder(folderId: number): Promise<unknown> {
    return this.client.delete(`/storage/folder/${folderId}`, this.headers());
  }

  /**
   * Deletes a specific file entry
   * @param payload
   */
  public deleteFile(payload: DeleteFilePayload): Promise<unknown> {
    return this.client.delete(`/storage/folder/${payload.folderId}/file/${payload.fileId}`, this.headers());
  }

  /**
   * Returns a list of items in trash
   */
  public getTrash(): [Promise<FetchFolderContentResponse>, RequestCanceler] {
    const { promise, requestCanceler } = this.client.getCancellable<FetchFolderContentResponse>(
      '/storage/trash',
      this.headers(),
    );
    return [promise, requestCanceler];
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
