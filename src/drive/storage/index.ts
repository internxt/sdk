import axios, { AxiosStatic, CancelTokenSource } from 'axios';
import { extractAxiosErrorMessage } from '../../utils';
import {
  CreateFolderPayload,
  CreateFolderResponse,
  DriveFileData,
  DriveFolderData,
  FetchFolderContentResponse,
  FileEntry
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

  public createFolder(data: CreateFolderPayload): [
    Promise<CreateFolderResponse>,
    CancelTokenSource
  ] {
    const cancelTokenSource = axios.CancelToken.source();
    const promise = this.axios
      .post(`${this.apiUrl}/api/storage/folder`, {
        parentFolderId: data.parentFolderId,
        folderName: data.folderName,
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

  private headers() {
    return headersWithToken(this.clientName, this.clientVersion, this.token);
  }
}