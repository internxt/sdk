import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  GenerateShareFileLinkPayload,
  GenerateShareFolderLinkPayload, SharedDirectoryFiles, SharedDirectoryFolders,
  GetSharedDirectoryFoldersPayload, SharedFolderInfo,
  SharedFileInfo,
  IShare, GetSharedDirectoryFilesPayload
} from './types';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { HttpClient } from '../../shared/http/client';

export * as ShareTypes from './types';

export class Share {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Share(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Creates a new link to share a file
   * @param payload
   */
  public createShareFileLink(payload: GenerateShareFileLinkPayload): Promise<{
    token: string
  }> {
    return this.client
      .post(
        `/storage/share/file/${payload.fileId}`,
        {
          views: payload.views,
          encryptionKey: payload.encryptionKey,
          fileToken: payload.fileToken,
          bucket: payload.bucket,
        },
        this.headers()
      );
  }

  /**
   * Creates a new link to share a folder
   * @param payload
   */
  public createShareFolderLink(payload: GenerateShareFolderLinkPayload): Promise<{
    token: string
  }> {
    return this.client
      .post(
        `/storage/share/folder/${payload.folderId}`,
        {
          views: payload.views,
          bucketToken: payload.bucketToken,
          bucket: payload.bucket,
          mnemonic: payload.encryptedMnemonic
        },
        this.headers()
      );
  }

  /**
   * Fetches data of a shared file
   * @param token
   */
  public getSharedFileByToken(token: string): Promise<SharedFileInfo> {
    return this.client
      .get(
        `/storage/share/${token}`,
        this.headers()
      );
  }

  /**
   * Fetches data of a shared folder
   * @param token
   */
  public getSharedFolderByToken(token: string): Promise<SharedFolderInfo> {
    return this.client
      .get(
        `/storage/shared-folder/${token}`,
        this.headers()
      );
  }

  /**
   * Fetches paginated folders of a specific shared folder
   * @param payload
   */
  public getSharedDirectoryFolders(payload: GetSharedDirectoryFoldersPayload): Promise<SharedDirectoryFolders> {
    return this.client
      .post(
        '/storage/share/down/folders',
        {
          token: payload.token,
          directoryId: payload.directoryId,
          offset: payload.offset,
          limit: payload.limit,
        },
        this.headers()
      );
  }

  /**
   * Fetches paginated files of a specific shared folder
   * @param payload
   */
  public getSharedDirectoryFiles(payload: GetSharedDirectoryFilesPayload): Promise<SharedDirectoryFiles> {
    return this.client
      .post(
        '/storage/share/down/files',
        {
          token: payload.token,
          directoryId: payload.directoryId,
          offset: payload.offset,
          limit: payload.limit,
          code: payload.code,
        },
        this.headers()
      );
  }

  /**
   * Fetches the list of shared items
   */
  public getShareList(): Promise<IShare> {
    return this.client
      .get(
        '/share/list',
        this.headers()
      );
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