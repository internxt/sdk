import axios, { AxiosStatic, CancelTokenSource } from 'axios';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  CreateFolderPayload,
  CreateFolderResponse,
  DeleteFilePayload,
  DriveFileData,
  FetchFolderContentResponse,
  FileEntry,
  MoveFilePayload, MoveFileResponse,
  MoveFolderPayload,
  MoveFolderResponse,
  UpdateFilePayload,
  UpdateFolderMetadataPayload,
  FetchLimitResponse, UsageResponse
} from './types';
import { ApiModule } from '../../shared/modules';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';

export * as StorageTypes from './types';

export class Storage extends ApiModule {
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Storage(axios, apiUrl, appDetails, apiSecurity);
  }

  constructor(axios: AxiosStatic, apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    super(axios, apiUrl);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Creates a new folder
   * @param payload
   */
  public createFolder(payload: CreateFolderPayload): [
    Promise<CreateFolderResponse>,
    CancelTokenSource
  ] {
    const cancelTokenSource = axios.CancelToken.source();
    const promise = this.axios
      .post('/storage/folder', {
        parentFolderId: payload.parentFolderId,
        folderName: payload.folderName,
      }, {
        cancelToken: cancelTokenSource.token,
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });

    return [promise, cancelTokenSource];
  }

  /**
   * Moves a specific folder to a new location
   * @param payload
   */
  public async moveFolder(payload: MoveFolderPayload): Promise<MoveFolderResponse> {
    return this.axios
      .post('/storage/move/folder', {
        folderId: payload.folderId,
        destination: payload.destinationFolderId,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Updates the metadata of a folder
   * @param payload
   */
  public async updateFolder(payload: UpdateFolderMetadataPayload): Promise<void> {
    await this.axios
      .post(`/storage/folder/${payload.folderId}/meta`, {
        metadata: payload.changes
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Fetches & returns the contents of a specific folder
   * @param folderId
   */
  public getFolderContent(folderId: number): [
    Promise<FetchFolderContentResponse>,
    CancelTokenSource
  ] {
    const cancelTokenSource = axios.CancelToken.source();
    const promise = this.axios
      .get<FetchFolderContentResponse>(`/storage/v2/folder/${folderId}`, {
        cancelToken: cancelTokenSource.token,
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });

    return [promise, cancelTokenSource];
  }

  /**
   * Removes a specific folder from the centralized persistence
   * @param folderId
   */
  public deleteFolder(folderId: number): Promise<unknown> {
    return this.axios
      .delete(`/storage/folder/${folderId}`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Creates a new file entry
   * @param fileEntry
   */
  public createFileEntry(fileEntry: FileEntry): Promise<DriveFileData> {
    return this.axios
      .post('/storage/file', {
        file: {
          fileId: fileEntry.id,
          type: fileEntry.type,
          bucket: fileEntry.bucket,
          size: fileEntry.size,
          folder_id: fileEntry.folder_id,
          name: fileEntry.name,
          encrypt_version: fileEntry.encrypt_version,
        }
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Updates the details of a file entry
   * @param payload
   */
  public updateFile(payload: UpdateFilePayload): Promise<any> {
    return this.axios
      .post(`/storage/file/${payload.fileId}/meta`, {
        metadata: payload.metadata,
        bucketId: payload.bucketId,
        relativePath: payload.destinationPath,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Deletes a specific file entry
   * @param payload
   */
  public deleteFile(payload: DeleteFilePayload): Promise<unknown> {
    return this.axios
      .delete(`/storage/folder/${payload.folderId}/file/${payload.fileId}`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Updates the persisted path of a file entry
   * @param payload
   */
  public moveFile(payload: MoveFilePayload): Promise<MoveFileResponse> {
    return this.axios
      .post('/storage/move/file', {
        fileId: payload.fileId,
        destination: payload.destination,
        relativePath: payload.destinationPath,
        bucketId: payload.bucketId,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns a list of the n most recent files
   * @param limit
   */
  public getRecentFiles(limit: number): Promise<DriveFileData[]> {
    return this.axios
      .get(`/storage/recents?limit=${limit}`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns the current space usage of the user
   */
  public spaceUsage(): Promise<UsageResponse> {
    return this.axios
      .get('/usage', {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns the current space limit for the user
   */
  public spaceLimit(): Promise<FetchLimitResponse> {
    return this.axios
      .get('/limit', {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
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
      this.apiSecurity.mnemonic
    );
  }

}