import axios, { AxiosStatic, CancelTokenSource } from 'axios';
import { extractAxiosErrorMessage } from '../../utils';
import { DriveFileData, DriveFolderData, FetchFolderContentResponse } from './types';

export * as StorageTypes from './types';

export class Storage {
  private readonly axios: AxiosStatic;
  private readonly apiUrl: string;
  private readonly clientName: string;
  private readonly clientVersion: string;

  public static client(apiUrl: string, clientName: string, clientVersion: string) {
    return new Storage(axios, apiUrl, clientName, clientVersion);
  }

  constructor(axios: AxiosStatic, apiUrl: string, clientName: string, clientVersion: string) {
    this.axios = axios;
    this.apiUrl = apiUrl;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
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
        cancelToken: cancelTokenSource.token
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

}