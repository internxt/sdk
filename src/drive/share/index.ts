import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { GenerateShareFileLinkPayload, GenerateShareFolderLinkPayload, GetShareInfoResponse, IShare } from './types';
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
   * Fetches info about a specific share
   * @param token
   */
  public getShareByToken(token: string): Promise<GetShareInfoResponse> {
    return this.client
      .get(
        `/storage/share/${token}`,
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