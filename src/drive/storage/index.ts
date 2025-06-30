import { Token } from '../../auth';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { CustomHeaders, addResourcesTokenToHeaders, headersWithToken } from '../../shared/headers';
import { HttpClient, RequestCanceler } from '../../shared/http/client';
import { UUID } from '../../shared/types/userSettings';
import { ItemType } from './../../workspaces/types';
import {
  AddItemsToTrashPayload,
  CheckDuplicatedFilesPayload,
  CheckDuplicatedFilesResponse,
  CheckDuplicatedFolderPayload,
  CheckDuplicatedFoldersResponse,
  CreateFolderByUuidPayload,
  CreateFolderPayload,
  CreateFolderResponse,
  CreateThumbnailEntryPayload,
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
  FolderAncestorWorkspace,
  FolderMeta,
  FolderTreeResponse,
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
  UsageResponseV2,
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
   * Updates the name of a folder with the given UUID.
   *
   * @param {Object} payload - The payload containing the folder UUID and the new name.
   * @param {string} payload.folderUuid - The UUID of the folder to update.
   * @param {string} payload.name - The new name for the folder.
   * @param {Token} [resourcesToken] - An optional token for authentication.
   * @return {Promise<void>} A promise that resolves when the folder name is successfully updated.
   */
  public updateFolderNameWithUUID(
    payload: { folderUuid: string; name: string },
    resourcesToken?: Token,
  ): Promise<void> {
    const { folderUuid, name } = payload;
    return this.client.put(
      `/folders/${folderUuid}/meta`,
      {
        plainName: name,
      },
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
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
   * @param {boolean} [offset] - The position of the first file to return.
   * @param {boolean} [limit] - The max number of files to be returned.
   * @param {boolean} [workspacesToken] - Token for accessing workspaces.
   * @return {[Promise<FetchFolderContentResponse>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolderContentByUuid({
    folderUuid,
    trash = false,
    offset,
    limit,
    workspacesToken,
  }: {
    folderUuid: string;
    trash?: boolean;
    limit?: number;
    offset?: number;
    workspacesToken?: string;
  }): [Promise<FetchFolderContentResponse>, RequestCanceler] {
    const query = new URLSearchParams();
    if (offset !== undefined) query.set('offset', String(offset));
    if (limit !== undefined) query.set('limit', String(limit));
    if (trash) query.set('trash', 'true');

    const customHeaders = workspacesToken
      ? {
          'x-internxt-workspace': workspacesToken,
        }
      : undefined;
    const { promise, requestCanceler } = this.client.getCancellable<FetchFolderContentResponse>(
      `/folders/content/${folderUuid}?${query}`,
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
   * @deprecated Use `deleteFolderByUuid` instead.
   */
  public deleteFolder(folderId: number): Promise<unknown> {
    return this.client.delete(`/storage/folder/${folderId}`, this.headers());
  }

  /**
   * Deletes a folder from the storage system using its unique identifier (UUID).
   *
   * @param folderId - The UUID of the folder to be deleted.
   * @returns A promise that resolves with the response of the delete operation.
   */
  public deleteFolderByUuid(folderId: string): Promise<void> {
    return this.client.delete(`/folders/${folderId}`, this.headers());
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
  public createFileEntryByUuid(fileEntry: FileEntryByUuid, resourcesToken?: string): Promise<DriveFileData> {
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
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
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
   * Creates a new thumbnail entry using drive-server-wip
   * @param CreateThumbnailEntryPayload
   */
  public createThumbnailEntryWithUUID(
    thumbnailEntry: CreateThumbnailEntryPayload,
    resourcesToken?: string,
  ): Promise<Thumbnail> {
    return this.client.post(
      '/files/thumbnail',
      {
        ...thumbnailEntry,
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
   * Updates the name of a file with the given UUID.
   *
   * @param {Object} payload - The payload containing the UUID and new name of the file.
   * @param {string} payload.fileUuid - The UUID of the file.
   * @param {string} payload.name - The new name of the file.
   * @param {string} [resourcesToken] - The token for accessing resources.
   * @return {Promise<void>} - A Promise that resolves when the file name is successfully updated.
   */
  public updateFileNameWithUUID(payload: { fileUuid: string; name: string }, resourcesToken?: Token): Promise<void> {
    const { fileUuid, name } = payload;
    return this.client.put(
      `/files/${fileUuid}/meta`,
      {
        plainName: name,
      },
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
    );
  }

  /**
   * Updates the name and the type from a given file UUID.
   *
   * @param {Object} payload - The payload containing the UUID and the new properties of the file.
   * @param {string} payload.fileUuid - The UUID of the file.
   * @param {string} payload.name - The new name of the file.
   * @param {string} payload.type - The new type of the file.
   * @param {string} [resourcesToken] - The token for accessing resources.
   * @return {Promise<void>} - A Promise that resolves when the file name is successfully updated.
   */
  public updateFileMetaByUUID(
    fileUuid: string,
    payload: { plainName?: string; type?: string | null },
    resourcesToken?: Token,
  ): Promise<void> {
    return this.client.put(
      `/files/${fileUuid}/meta`,
      payload,
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
    );
  }

  /**
   * Deletes a specific file entry
   * @param payload
   * @deprecated Use `deleteFileByUuid` instead.
   */
  public deleteFile(payload: DeleteFilePayload): Promise<unknown> {
    return this.client.delete(`/storage/folder/${payload.folderId}/file/${payload.fileId}`, this.headers());
  }

  /**
   * Deletes a file from the storage system using its unique identifier (UUID).
   *
   * @param fileId - The UUID of the file to be deleted.
   * @returns A promise that resolves with the response of the delete operation.
   */
  public deleteFileByUuid(fileId: string): Promise<{ deleted: boolean }> {
    return this.client.delete(`/files/${fileId}`, this.headers());
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
   * @deprecated use `getRecentFilesV2` call instead.
   */
  public getRecentFiles(limit: number): Promise<DriveFileData[]> {
    return this.client.get(`/storage/recents?limit=${limit}`, this.headers());
  }

  /**
   * Returns a list of the n most recent files
   * @param limit
   */
  public async getRecentFilesV2(limit: number): Promise<DriveFileData[]> {
    return this.client.get<DriveFileData[]>(`/files/recents?limit=${limit}`, this.headers());
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
   * @returns whether the user has uploaded any files
   */
  public hasUploadedFiles(): Promise<{ hasUploadedFiles: boolean }> {
    return this.client.get('/users/me/upload-status', this.headers());
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
   * @deprecated use `spaceUsageV2` call instead.
   */
  public spaceUsage(): Promise<UsageResponse> {
    return this.client.get('/usage', this.headers());
  }

  /**
   * Returns the current space usage of the user
   */
  public spaceUsageV2(): Promise<UsageResponseV2> {
    return this.client.get('/users/usage', this.headers());
  }

  /**
   * Returns the current space limit for the user
   * @deprecated use `spaceLimitV2` call instead.
   */
  public spaceLimit(): Promise<FetchLimitResponse> {
    return this.client.get('/limit', this.headers());
  }

  /**
   * Returns the current space limit for the user
   */
  public spaceLimitV2(): Promise<FetchLimitResponse> {
    return this.client.get('/users/limit', this.headers());
  }

  /**
   * Get global search items.
   *
   * @param {string} search - The name of the item.
   * @param {string} workspaceId - The ID of the workspace (optional).
   * @param {number} offset - The position of the first item to return (optional).
   * @returns {[Promise<SearchResultData>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getGlobalSearchItems(
    search: string,
    workspaceId?: string,
    offset?: number,
  ): [Promise<SearchResultData>, RequestCanceler] {
    const query = new URLSearchParams();
    if (offset !== undefined) query.set('offset', String(offset));

    const { promise, requestCanceler } = workspaceId
      ? this.client.getCancellable<SearchResultData>(
          `workspaces/${workspaceId}/fuzzy/${search}?${query}`,
          this.headers(),
        )
      : this.client.getCancellable<SearchResultData>(`fuzzy/${search}?${query}`, this.headers());

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
      this.apiSecurity?.workspaceToken,
      customHeaders,
    );
  }

  /**
   * Gets the ancestors of a given folder UUID
   *
   * @param {string} uuid - UUID of the folder.
   * @returns {Promise<FolderAncestor[]>} A promise that resolves with an array of ancestors of the given folder.
   */
  public getFolderAncestors(uuid: string): Promise<FolderAncestor[]> {
    return this.client.get<FolderAncestor[]>(`folders/${uuid}/ancestors`, this.headers());
  }

  /**
   * Gets the ancestors of an item with the given UUID and type in a Workspace
   *
   * @param {string} workspaceId - UUID of the workspace.
   * @param {string} itemType - itemType to know if the item is file or folder
   * @param {string} uuid - UUID of the item.
   * @returns {Promise<FolderAncestor[]>} A promise that resolves with an array of ancestors of the given folder.
   */
  public getFolderAncestorsInWorkspace(
    workspaceId: string,
    itemType: ItemType,
    uuid: string,
    resourcesToken?: Token,
  ): Promise<FolderAncestorWorkspace[]> {
    return this.client.get<FolderAncestorWorkspace[]>(
      `workspaces/${workspaceId}/${itemType}/${uuid}/ancestors`,
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
    );
  }

  /**
   * Gets the meta of a given folder UUID
   *
   * @param {string} folderUUID - UUID of the folder.
   * @returns {Promise<FolderMeta>}
   */
  public getFolderMeta(uuid: string, workspacesToken?: string, resourcesToken?: string): Promise<FolderMeta> {
    const customHeaders = workspacesToken
      ? {
          'x-internxt-workspace': workspacesToken,
        }
      : undefined;

    return this.client.get<FolderMeta>(
      `folders/${uuid}/meta`,
      addResourcesTokenToHeaders(this.headers(customHeaders), resourcesToken),
    );
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

  /**
   * Retrieves the folder tree based on the UUID.
   *
   * @param {string} uuid - The UUID of the folder.
   * @return {Promise<FolderTreeResponse>} The promise containing the folder tree response.
   */
  public getFolderTree(uuid: string): Promise<FolderTreeResponse> {
    return this.client.get(`/folders/${uuid}/tree`, this.headers());
  }

  /**
   * Checks if the given files already exist in the given folder.
   *
   * @param {CheckDuplicatedFilesPayload} payload - Payload containing the folder UUID and the list of files to check.
   * @return {Promise<CheckDuplicatedFilesResponse>} - Promise that contains the duplicated files in a list.
   */
  public checkDuplicatedFiles({
    folderUuid,
    filesList,
  }: CheckDuplicatedFilesPayload): Promise<CheckDuplicatedFilesResponse> {
    return this.client.post(
      `/folders/content/${folderUuid}/files/existence`,
      {
        files: filesList,
      },
      this.headers(),
    );
  }

  /**
   * Checks if the given folders names already exist in the given folder
   *
   * @param {CheckDuplicatedFolderPayload} payload - Payload containing the folder UUID and the list of folders to check.
   * @return {Promise<CheckDuplicatedFoldersResponse>} - Promise that contains the duplicated folders in a list.
   */
  public checkDuplicatedFolders({
    folderUuid,
    folderNamesList,
  }: CheckDuplicatedFolderPayload): Promise<CheckDuplicatedFoldersResponse> {
    return this.client.post(
      `/folders/content/${folderUuid}/folders/existence`,
      {
        plainNames: folderNamesList,
      },
      this.headers(),
    );
  }

  /**
   * Gets the folder meta from a given path (e.g. "/folder1/folder2")
   *
   * @param {string} folderPath - The path of the folder.
   * @returns {Promise<FolderMeta>} A promise that resolves the folder on that path.
   */
  public getFolderByPath(folderPath: string): Promise<FolderMeta> {
    return this.client.get<FolderMeta>(`folders/meta?path=${folderPath}`, this.headers());
  }

  /**
   * Gets the file meta from a given path (e.g. "/folder1/folder2/file.png")
   *
   * @param {string} filePath - The path of the file.
   * @returns {Promise<FileMeta>} A promise that resolves the file on that path.
   */
  public getFileByPath(filePath: string): Promise<FileMeta> {
    return this.client.get<FileMeta>(`files/meta?path=${filePath}`, this.headers());
  }
}
