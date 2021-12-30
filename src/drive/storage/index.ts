import axios, { AxiosStatic, CancelTokenSource } from 'axios';
import { extractAxiosErrorMessage } from '../../utils';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  CreateFolderPayload,
  CreateFolderResponse,
  DeleteFilePayload,
  DriveFileData,
  DriveFolderData,
  FetchFolderContentResponse,
  FileEntry,
  HashPath,
  MoveFilePayload, MoveFileResponse,
  MoveFolderPayload,
  MoveFolderResponse,
  UpdateFilePayload,
  UpdateFolderMetadataPayload
} from './types';
import { Token } from '../../auth';

export * as StorageTypes from './types';

export class Storage {
  private readonly axios: AxiosStatic;
  private readonly apiUrl: string;
  private readonly clientName: string;
  private readonly clientVersion: string;
  private readonly token: Token;
  private readonly mnemonic: string;

  public static client(
    apiUrl: string, clientName: string, clientVersion: string, token: Token, mnemonic: string
  ) {
    return new Storage(axios, apiUrl, clientName, clientVersion, token, mnemonic);
  }

  constructor(
    axios: AxiosStatic, apiUrl: string, clientName: string, clientVersion: string, token: Token, mnemonic: string
  ) {
    this.axios = axios;
    this.apiUrl = apiUrl;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.token = token;
    this.mnemonic = mnemonic;
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
   */
  public async moveFolder(payload: MoveFolderPayload): Promise<MoveFolderResponse> {
    return this.axios
      .post(`${this.apiUrl}/api/storage/move/folder`, {
        folderId: payload.folder.id,
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
   * Deletes a specific file entry
   * @param payload
   */
  public deleteFile(payload: DeleteFilePayload) {
    return this.axios
      .delete(`${this.apiUrl}/api/storage/folder/${payload.folderId}/file/${payload.fileId}`, {
        headers: this.headers()
      });
  }

  /**
   * Updates the persisted path of a file entry
   * @param payload
   * @param hashPath
   */
  public moveFile(payload: MoveFilePayload, hashPath: HashPath): Promise<MoveFileResponse> {
    const hashedPath = hashPath(payload.destinationPath);
    return this.axios
      .post(`${this.apiUrl}/api/storage/move/file`, {
        fileId: payload.fileId,
        destination: payload.destination,
        relativePath: hashedPath,
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
  public recentFiles(limit: number): Promise<DriveFileData[]> {
    return this.axios
      .get(`${this.apiUrl}/api/storage/recents?limit=${limit}`, {
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
    return headersWithTokenAndMnemonic(this.clientName, this.clientVersion, this.token, this.mnemonic);
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