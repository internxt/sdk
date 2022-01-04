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
  UpdateFolderMetadataPayload
} from './types';
import { ApiSecureConnectionDetails } from '../../shared/types/apiConnection';
import { AppModule } from '../../shared/modules';

export * as StorageTypes from './types';

export class Storage extends AppModule {
  private readonly apiDetails: ApiSecureConnectionDetails;

  public static client(apiDetails: ApiSecureConnectionDetails) {
    return new Storage(axios, apiDetails);
  }

  constructor(axios: AxiosStatic, apiDetails: ApiSecureConnectionDetails) {
    super(axios);
    this.apiDetails = apiDetails;
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
      .post(`${this.apiDetails.url}/api/storage/folder`, {
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
      .post(`${this.apiDetails.url}/api/storage/move/folder`, {
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
      .post(`${this.apiDetails.url}/api/storage/folder/${payload.folderId}/meta`, {
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
      .get<FetchFolderContentResponse>(`${this.apiDetails.url}/api/storage/v2/folder/${folderId}`, {
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
      .delete(`${this.apiDetails.url}/api/storage/folder/${folderId}`, {
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
      .post(`${this.apiDetails.url}/api/storage/file`, {
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
      .post(`${this.apiDetails.url}/api/storage/file/${payload.fileId}/meta`, {
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
      .delete(`${this.apiDetails.url}/api/storage/folder/${payload.folderId}/file/${payload.fileId}`, {
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
      .post(`${this.apiDetails.url}/api/storage/move/file`, {
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
      .get(`${this.apiDetails.url}/api/storage/recents?limit=${limit}`, {
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
      this.apiDetails.clientName,
      this.apiDetails.clientVersion,
      this.apiDetails.token,
      this.apiDetails.mnemonic
    );
  }

}