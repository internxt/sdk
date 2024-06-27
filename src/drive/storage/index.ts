import { Token } from '../../auth';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { CustomHeaders, addResourcesTokenToHeaders, headersWithToken } from '../../shared/headers';
import { HttpClient, RequestCanceler } from '../../shared/http/client';
import { UUID } from '../../shared/types/userSettings';
import {
  AddItemsToTrashPayload,
  CreateFolderByUuidPayload,
  CreateFolderPayload,
  CreateFolderResponse,
  DeleteFilePayload,
  DriveFileData,
  FetchFolderContentResponse,
  FetchLimitResponse,
  FetchPaginatedFilesContent,
  FetchPaginatedFolderContentResponse,
  FetchPaginatedFoldersContent,
  FileEntry,
  FileEntryByUuid,
  FileMeta,
  FolderAncestor,
  FolderMeta,
  MoveFilePayload,
  MoveFileResponse,
  MoveFileUuidPayload,
  MoveFolderPayload,
  MoveFolderResponse,
  MoveFolderUuidPayload,
  ReplaceFile,
  SearchResultData,
  Thumbnail,
  ThumbnailEntry,
  UpdateFilePayload,
  UpdateFolderMetadataPayload,
  UsageResponse,
} from './types';

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
   * Creates a new folder
   * @param payload
   */
  public createFolderByUuid(payload: CreateFolderByUuidPayload): [Promise<CreateFolderResponse>, RequestCanceler] {
    const { promise, requestCanceler } = this.client.postCancellable<CreateFolderResponse>(
      '/folders',
      {
        plainName: payload.plainName,
        parentFolderUuid: payload.parentFolderUuid,
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
   * Moves a specific folder to a new location
   * @param payload
   */
  public async moveFolderByUuid(payload: MoveFolderUuidPayload): Promise<FolderMeta> {
    return this.client.patch(
      `/folders/${payload.folderUuid}`,
      {
        destinationFolder: payload.destinationFolderUuid,
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
   * Fetches and returns the contents of a specific folder by its UUID.
   *
   * @param {string} folderUuid - The UUID of the folder.
   * @param {boolean} [trash=false] - Whether to include trash items in the response.
   * @return {[Promise<FetchFolderContentResponse>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolderContentByUuid(
    folderUuid: string,
    trash = false,
    workspacesToken?: string,
  ): [Promise<FetchFolderContentResponse>, RequestCanceler] {
    const query = trash ? '/?trash=true' : '';
    const customHeaders = workspacesToken
      ? {
          'x-internxt-workspace': workspacesToken,
        }
      : undefined;
    const { promise, requestCanceler } = this.client.getCancellable<FetchFolderContentResponse>(
      `/folders/content/${folderUuid}${query}`,
      this.headers(customHeaders),
    );

    return [promise, requestCanceler];
  }

  /**
   * Retrieves a file with the specified fileId along with the associated workspacesToken.
   *
   * @param {string} fileId - The ID of the file to retrieve.
   * @param {string} [workspacesToken] - Token for accessing workspaces.
   * @return {[Promise<FileMeta>, RequestCanceler]} A promise with FileMeta and a canceler for the request.
   */
  public getFile(fileId: string, workspacesToken?: string): [Promise<FileMeta>, RequestCanceler] {
    const customHeaders = workspacesToken
      ? {
          'x-internxt-workspace': workspacesToken,
        }
      : undefined;
    const { promise, requestCanceler } = this.client.getCancellable<FileMeta>(
      `/files/${fileId}/meta`,
      this.headers(customHeaders),
    );
    return [promise, requestCanceler];
  }

  /**
   * Gets the files in a folder.
   *
   * @param {number} folderId - The ID of the folder.
   * @param {number} [offset=0] - The position of the first file to return.
   * @param {number} [limit=50] - The max number of files to be returned.
   * @param {string} [sort=plainName] - The reference column to sort it.
   * @param {string} [order=ASC] - The order to be followed.
   * @returns {[Promise<FetchPaginatedFolderContentResponse>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolderFiles(
    folderId: number,
    offset = 0,
    limit = 50,
    sort = '',
    order = '',
  ): [Promise<FetchPaginatedFolderContentResponse>, RequestCanceler] {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const sortQuery = sort !== '' ? `&sort=${sort}` : '';
    const orderQuery = order !== '' ? `&order=${order}` : '';

    const query = `${offsetQuery}${limitQuery}${sortQuery}${orderQuery}`;

    const { promise, requestCanceler } = this.client.getCancellable<FetchPaginatedFolderContentResponse>(
      `folders/${folderId}/files/${query}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Gets the files in a folder by its UUID.
   *
   * @param {UUID} folderUuid - The UUID of the folder.
   * @param {number} [offset=0] - The position of the first file to return.
   * @param {number} [limit=50] - The max number of files to be returned.
   * @param {string} [sort=plainName] - The reference column to sort it.
   * @param {string} [order=ASC] - The order to be followed.
   * @returns {[Promise<FetchPaginatedFilesContent>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolderFilesByUuid(
    folderUuid: UUID,
    offset = 0,
    limit = 50,
    sort = '',
    order = '',
  ): [Promise<FetchPaginatedFilesContent>, RequestCanceler] {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const sortQuery = sort !== '' ? `&sort=${sort}` : '';
    const orderQuery = order !== '' ? `&order=${order}` : '';

    const query = `${offsetQuery}${limitQuery}${sortQuery}${orderQuery}`;

    const { promise, requestCanceler } = this.client.getCancellable<FetchPaginatedFilesContent>(
      `folders/content/${folderUuid}/files/${query}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Gets the subfolders of a folder.
   *
   * @param {number} folderId - The ID of the folder.
   * @param {number} [offset=0] - The position of the first subfolder to return.
   * @param {number} [limit=50] - The max number of subfolders to return.
   * @param {string} [sort=plainName] - The reference column to sort it.
   * @param {string} [order=ASC] - The order to be followed.
   * @returns {[Promise<FetchPaginatedFolderContentResponse>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolderFolders(
    folderId: number,
    offset = 0,
    limit = 50,
    sort = '',
    order = '',
  ): [Promise<FetchPaginatedFolderContentResponse>, RequestCanceler] {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const sortQuery = sort !== '' ? `&sort=${sort}` : '';
    const orderQuery = order !== '' ? `&order=${order}` : '';

    const query = `${offsetQuery}${limitQuery}${sortQuery}${orderQuery}`;

    const { promise, requestCanceler } = this.client.getCancellable<FetchPaginatedFolderContentResponse>(
      `folders/${folderId}/folders/${query}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Gets the subfolders of a folder by its UUID.
   *
   * @param {UUID} folderUuid - The UUID of the folder.
   * @param {number} [offset=0] - The position of the first subfolder to return.
   * @param {number} [limit=50] - The max number of subfolders to return.
   * @param {string} [sort=plainName] - The reference column to sort it.
   * @param {string} [order=ASC] - The order to be followed.
   * @returns {[Promise<FetchPaginatedFoldersContent>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolderFoldersByUuid(
    folderUuid: UUID,
    offset = 0,
    limit = 50,
    sort = '',
    order = '',
  ): [Promise<FetchPaginatedFoldersContent>, RequestCanceler] {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const sortQuery = sort !== '' ? `&sort=${sort}` : '';
    const orderQuery = order !== '' ? `&order=${order}` : '';

    const query = `${offsetQuery}${limitQuery}${sortQuery}${orderQuery}`;

    const { promise, requestCanceler } = this.client.getCancellable<FetchPaginatedFoldersContent>(
      `folders/content/${folderUuid}/folders/${query}`,
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
  public createFileEntry(fileEntry: FileEntry, resourcesToken?: Token): Promise<DriveFileData> {
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
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
    );
  }

  /**
   * Creates a new file entry
   * @param fileEntry
   */
  public createFileEntryByUuid(fileEntry: FileEntryByUuid): Promise<DriveFileData> {
    return this.client.post(
      '/files',
      {
        name: fileEntry.name,
        bucket: fileEntry.bucket,
        fileId: fileEntry.id,
        encryptVersion: fileEntry.encrypt_version,
        folderUuid: fileEntry.folder_id,
        size: fileEntry.size,
        plainName: fileEntry.plain_name,
        type: fileEntry.type,
      },
      this.headers(),
    );
  }

  /**
   * Creates a new thumbnail entry
   * @param thumbnailEntry
   */
  public createThumbnailEntry(thumbnailEntry: ThumbnailEntry, resourcesToken?: Token): Promise<Thumbnail> {
    return this.client.post(
      '/storage/thumbnail',
      {
        thumbnail: thumbnailEntry,
      },
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
    );
  }

  /**
   * Updates the details of a file entry
   * @param payload
   */
  public updateFile(payload: UpdateFilePayload, resourcesToken?: Token): Promise<void> {
    return this.client.post(
      `/storage/file/${payload.fileId}/meta`,
      {
        metadata: payload.metadata,
        bucketId: payload.bucketId,
        relativePath: payload.destinationPath,
      },
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
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
   * Moves a specific file to a new location
   * @param payload
   */
  public async moveFileByUuid(payload: MoveFileUuidPayload): Promise<FileMeta> {
    return this.client.patch(
      `/files/${payload.fileUuid}`,
      {
        destinationFolder: payload.destinationFolderUuid,
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
  public addItemsToTrash(payload: AddItemsToTrashPayload): Promise<void> {
    return this.client.post(
      '/storage/trash/add',
      {
        items: payload.items,
      },
      this.headers(),
    );
  }

  /**
   * Returns a list of the n most recent files
   * @param limit
   */
  public searchItemsByName(plain_name: string): Promise<DriveFileData[]> {
    return this.client.post('/users/search', { plain_name }, this.headers());
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
   * Get global search items.
   *
   * @param {string} search - The name of the item.
   * @returns {[Promise<SearchResultData>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getGlobalSearchItems(search: string): [Promise<SearchResultData>, RequestCanceler] {
    const { promise, requestCanceler } = this.client.getCancellable<SearchResultData>(
      `fuzzy/${search}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers(customHeaders?: CustomHeaders) {
    return headersWithToken(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      customHeaders,
    );
  }

  /**
   * Gets the ancestors of a given folder UUID
   *
   * @param {string} folderUUID - UUID of the folder.
   * @returns {Promise<FolderAncestor[]>}
   */
  public getFolderAncestors(uuid: string): Promise<FolderAncestor[]> {
    return this.client.get<FolderAncestor[]>(`folders/${uuid}/ancestors`, this.headers());
  }

  /**
   * Gets the meta of a given folder UUID
   *
   * @param {string} folderUUID - UUID of the folder.
   * @returns {Promise<FolderMeta>}
   */
  public getFolderMeta(uuid: string, workspacesToken?: string): Promise<FolderMeta> {
    const customHeaders = workspacesToken
      ? {
          'x-internxt-workspace': workspacesToken,
        }
      : undefined;
    return this.client.get<FolderMeta>(`folders/${uuid}/meta`, this.headers(customHeaders));
  }

  /**
   * Gets the meta of a given folder Id
   *
   * @param {number} folderId - Id of the folder.
   * @returns {Promise<FolderMeta>}
   */
  public getFolderMetaById(folderId: number): Promise<FolderMeta> {
    return this.client.get<FolderMeta>(`folders/${folderId}/metadata`, this.headers());
  }

  /**
   * Replaces a file with a new one.
   *
   * @param {string} uuid - UUID of the file.
   * @param {ReplaceFile} payload
   * @returns {Promise<DriveFileData>} - The replaced file data.
   */
  public replaceFile(uuid: string, payload: ReplaceFile): Promise<DriveFileData> {
    return this.client.put<DriveFileData>(`/files/${uuid}`, { ...payload }, this.headers());
  }

  /**
   * Checks the size limit for a file.
   *
   * @param {number} size - The size of the file to check.
   * @return {Promise<void>} - A promise that resolves when the size limit check is complete.
   */
  public async checkSizeLimit(size: number): Promise<void> {
    return this.client.post(
      '/files/check-size-limit',
      {
        file: {
          size,
        },
      },
      this.headers(),
    );
  }
}
