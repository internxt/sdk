import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  CreateFolderPayload,
  CreateFolderResponse,
  DeleteFilePayload,
  DriveFileData,
  FetchFolderContentResponse,
  FileEntry,
  MoveFilePayload,
  MoveFileResponse,
  MoveFolderPayload,
  MoveFolderResponse,
  UpdateFilePayload,
  UpdateFolderMetadataPayload,
  FetchLimitResponse,
  UsageResponse,
  AddItemsToTrashPayload,
  ThumbnailEntry,
  Thumbnail,
} from './types';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { HttpClient, RequestCanceler } from '../../shared/http/client';

export * as StorageTypes from './types';

export class Storage {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Storage(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Creates a new folder
   * @param payload
   */
  public createFolder(payload: CreateFolderPayload): [Promise<CreateFolderResponse>, RequestCanceler] {
    const { promise, requestCanceler } = this.client.postCancellable<CreateFolderResponse>(
      '/storage/folder',
      {
        parentFolderId: payload.parentFolderId,
        folderName: payload.folderName,
      },
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Moves a specific folder to a new location
   * @param payload
   */
  public async moveFolder(payload: MoveFolderPayload): Promise<MoveFolderResponse> {
    return this.client.post(
      '/storage/move/folder',
      {
        folderId: payload.folderId,
        destination: payload.destinationFolderId,
      },
      this.headers(),
    );
  }

  /**
   * Updates the metadata of a folder
   * @param payload
   */
  public async updateFolder(payload: UpdateFolderMetadataPayload): Promise<void> {
    await this.client.post(
      `/storage/folder/${payload.folderId}/meta`,
      {
        metadata: payload.changes,
      },
      this.headers(),
    );
  }

  /**
   * Fetches & returns the contents of a specific folder
   * @param folderId
   */
  public getFolderContent(folderId: number, trash = false): [Promise<FetchFolderContentResponse>, RequestCanceler] {
    const query = trash ? '/?trash=true' : '';

    const { promise, requestCanceler } = this.client.getCancellable<FetchFolderContentResponse>(
      `/storage/v2/folder/${folderId}${query}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Removes a specific folder from the centralized persistence
   * @param folderId
   */
   public deleteFolder(folderId: number): Promise<unknown> {
    return this.client.delete(`/storage/folder/${folderId}`, this.headers());
  }

  /**
   * Returns the total size of a folder
   * @param folderId
   */
  public getFolderSize(folderId: number): Promise<number> {
    return this.client
      .get<{
        size: number;
      }>(`/storage/folder/size/${folderId}`, this.headers())
      .then((response) => {
        return response.size;
      });
  }

  /**
   * Creates a new file entry
   * @param fileEntry
   */
  public createFileEntry(fileEntry: FileEntry): Promise<DriveFileData> {
    return this.client.post(
      '/storage/file',
      {
        file: {
          fileId: fileEntry.id,
          type: fileEntry.type,
          bucket: fileEntry.bucket,
          size: fileEntry.size,
          folder_id: fileEntry.folder_id,
          name: fileEntry.name,
          plain_name: fileEntry.plain_name,
          encrypt_version: fileEntry.encrypt_version,
        },
      },
      this.headers(),
    );
  }

  /**
   * Creates a new thumbnail entry
   * @param thumbnailEntry
   */
  public createThumbnailEntry(thumbnailEntry: ThumbnailEntry): Promise<Thumbnail> {
    return this.client.post(
      '/storage/thumbnail',
      {
        thumbnail: thumbnailEntry,
      },
      this.headers(),
    );
  }

  /**
   * Updates the details of a file entry
   * @param payload
   */
  public updateFile(payload: UpdateFilePayload): Promise<void> {
    return this.client.post(
      `/storage/file/${payload.fileId}/meta`,
      {
        metadata: payload.metadata,
        bucketId: payload.bucketId,
        relativePath: payload.destinationPath,
      },
      this.headers(),
    );
  }

  /**
   * Deletes a specific file entry
   * @param payload
   */
   public deleteFile(payload: DeleteFilePayload): Promise<unknown> {
    return this.client.delete(`/storage/folder/${payload.folderId}/file/${payload.fileId}`, this.headers());
  }

  /**
   * Updates the persisted path of a file entry
   * @param payload
   */
  public moveFile(payload: MoveFilePayload): Promise<MoveFileResponse> {
    return this.client.post(
      '/storage/move/file',
      {
        fileId: payload.fileId,
        destination: payload.destination,
        relativePath: payload.destinationPath,
        bucketId: payload.bucketId,
      },
      this.headers(),
    );
  }

  /**
   * Returns a list of the n most recent files
   * @param limit
   */
  public getRecentFiles(limit: number): Promise<DriveFileData[]> {
    return this.client.get(`/storage/recents?limit=${limit}`, this.headers());
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
   * Returns the current space usage of the user
   */
  public spaceUsage(): Promise<UsageResponse> {
    return this.client.get('/usage', this.headers());
  }

  /**
   * Returns the current space limit for the user
   */
  public spaceLimit(): Promise<FetchLimitResponse> {
    return this.client.get('/limit', this.headers());
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
