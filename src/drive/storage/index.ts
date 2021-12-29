import axios, { AxiosStatic, CancelTokenSource } from 'axios';
import { extractAxiosErrorMessage } from '../../utils';
import {
  CreateFolderPayload,
  CreateFolderResponse,
  DriveFileData,
  DriveFolderData,
  FetchFolderContentResponse,
  FileEntry, HashPath, MoveFolderPayload, MoveFolderResponse, UpdateFilePayload, UpdateFolderMetadataPayload
} from './types';
import { Token } from '../../auth';
import { headersWithToken } from '../../shared/headers';

export * as StorageTypes from './types';

export class Storage {
  private readonly axios: AxiosStatic;
  private readonly apiUrl: string;
  private readonly clientName: string;
  private readonly clientVersion: string;
  private readonly token: Token;

  public static client(apiUrl: string, clientName: string, clientVersion: string, token: Token) {
    return new Storage(axios, apiUrl, clientName, clientVersion, token);
  }

  constructor(axios: AxiosStatic, apiUrl: string, clientName: string, clientVersion: string, token: Token) {
    this.axios = axios;
    this.apiUrl = apiUrl;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.token = token;
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
      .post(`${this.apiUrl}/api/storage/folder`, {
        parentFolderId: payload.parentFolderId,
        folderName: payload.folderName,
      }, {
        cancelToken: cancelTokenSource.token,
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        throw new Error(extractAxiosErrorMessage(error));
      });

    return [promise, cancelTokenSource];
  }

  /**
   * Moves a specific folder to a new location
   * @param payload
   * @param hashPath
   */
  public async moveFolder(
    payload: MoveFolderPayload,
    hashPath: HashPath
  ): Promise<MoveFolderResponse> {
    const moveFolderResponse = await this.axios
      .post(`${this.apiUrl}/api/storage/move/folder`, {
        folderId: payload.folder.id,
        destination: payload.destinationFolderId,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });

    const finalFolderPath = `${payload.destinationPath}/${payload.folder.name}`;
    await this.updateFolderContents(
      payload.folder.id,
      finalFolderPath,
      payload.bucketId,
      hashPath
    );

    return moveFolderResponse;
  }

  /**
   * Updates the metadata of a folder
   * @param payload
   * @param hashPath
   */
  public async updateFolder(
    payload: UpdateFolderMetadataPayload,
    hashPath: HashPath
  ): Promise<void> {
    await this.axios
      .post(`${this.apiUrl}/api/storage/folder/${payload.folderId}/meta`, payload.changes, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });

    await this.updateFolderContents(
      payload.folderId,
      payload.destinationPath,
      payload.bucketId,
      hashPath
    );
  }

  /**
   * Fetches & returns the contents of a specific folder
   * @param folderId
   */
  public getFolderContent(folderId: number): [
    Promise<{
      folders: DriveFolderData[];
      files: DriveFileData[]
    }>,
    CancelTokenSource
  ] {
    const cancelTokenSource = axios.CancelToken.source();
    const promise = this.axios
      .get<FetchFolderContentResponse>(`${this.apiUrl}/api/storage/v2/folder/${folderId}`, {
        cancelToken: cancelTokenSource.token,
        headers: this.headers()
      })
      .then(response => {
        return {
          folders: response.data.children.map(folder => ({ ...folder, isFolder: true })),
          files: response.data.files,
        };
      })
      .catch(error => {
        throw new Error(extractAxiosErrorMessage(error));
      });

    return [promise, cancelTokenSource];
  }

  /**
   * Removes a specific folder from the centralized persistence
   * @param folderId
   */
  public deleteFolder(folderId: number): Promise<void> {
    return this.axios
      .delete(`${this.apiUrl}/api/storage/folder/${folderId}`, {
        headers: this.headers()
      });
  }

  /**
   * Updates all the elements contained in a specific folder
   * @param folderId
   * @param finalPath
   * @param bucketId
   * @param hashPath
   * @private
   */
  private async updateFolderContents(folderId: number, finalPath: string, bucketId: string, hashPath: HashPath) {
    // * Renames files iterating over folders
    const pendingFolders = [{
      destinationPath: finalPath,
      folderId: folderId
    }];

    while (pendingFolders.length > 0) {
      const currentFolder = pendingFolders[0];
      const [folderContentPromise] = this.getFolderContent(currentFolder.folderId);
      const { files, folders } = await folderContentPromise;

      pendingFolders.shift();

      // * Renames current folder files
      for (const file of files) {
        const relativePath = `${currentFolder.destinationPath}/${this.fileDisplayName(file)}`;
        const hashedPath = hashPath(relativePath);
        await this.updateFileReference(file.fileId, bucketId, hashedPath);
      }

      // * Adds current folder folders to pending
      pendingFolders.push(
        ...folders.map((folderData) => ({
          destinationPath: `${currentFolder.destinationPath}/${folderData.name}`,
          folderId: folderData.id,
        })),
      );
    }
  }

  /**
   * Updates the stored reference of a file in the centralized persistence
   * @param fileId
   * @param bucketId
   * @param hashedPath
   * @private
   */
  private updateFileReference(
    fileId: string,
    bucketId: string,
    hashedPath: string,
  ): Promise<void> {
    return this.axios
      .post(`${this.apiUrl}/api/storage/rename-file-in-network`, {
        fileId: fileId,
        bucketId: bucketId,
        relativePath: hashedPath,
      }, {
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
  public createFileEntry(fileEntry: FileEntry): Promise<unknown> {
    return this.axios
      .post(`${this.apiUrl}/api/storage/file`, {
        fileId: fileEntry.id,
        type: fileEntry.type,
        bucket: fileEntry.bucket,
        size: fileEntry.size,
        folder_id: fileEntry.folder_id,
        name: fileEntry.name,
        encrypt_version: fileEntry.encrypt_version,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        throw new Error(extractAxiosErrorMessage(error));
      });
  }

  /**
   * Updates the details of a file entry
   * @param payload
   * @param hashPath
   */
  public updateFile(payload: UpdateFilePayload, hashPath: HashPath) {
    const hashedPath = hashPath(payload.destinationPath);
    return this.axios
      .post(`${this.apiUrl}/api/storage/file/${payload.fileId}/meta`, {
        metadata: payload.metadata,
        bucketId: payload.bucketId,
        relativePath: hashedPath,
      }, {
        headers: this.headers()
      });
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken(this.clientName, this.clientVersion, this.token);
  }

  /**
   * Returns the file name correctly formatted
   * @param item
   * @private
   */
  private fileDisplayName(item: {
    name: string;
    type?: string;
  }): string {
    const { name, type } = item;
    return `${name}${type ? '.' + type : ''}`;
  }
}