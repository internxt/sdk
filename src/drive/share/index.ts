import { basicHeaders, headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  GenerateShareLinkPayload,
  UpdateShareLinkPayload,
  GetSharedDirectoryPayload,
  GetShareLinkFolderSizePayload,
  ShareLink,
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
   * Fetches the list of shared items
   */
  public getShareLinks(page = 1, perPage = 50): Promise<Array<Partial<ShareLink>> | []> {
    return this.client
      .get(
        `/storage/share/list?page=${page}&perPage=${perPage}`,
        this.headers()
      );
  }

  /**
   * Creates a new link to share a file or folder
   * @param payload
   */
  public createShareLink(payload: GenerateShareLinkPayload): Promise<{
    created: boolean,
    token: string
  }> {
    const types = ['file', 'folder'];
    if(!types.includes(payload.type)) {
      throw new Error('Invalid type');
    }
    return this.client
      .post(
        `/storage/share/${payload.type}/${payload.itemId}`,
        {
          timesValid: payload.timesValid,
          encryptionKey: payload.encryptionKey,
          mnemonic: payload.mnemonic,
          itemToken: payload.itemToken,
          bucket: payload.bucket,
        },
        this.headers()
      );
  }

  /**
   * Update share link
   * @param payload
   */
   public updateShareLink(payload: UpdateShareLinkPayload): Promise<ShareLink> {
    return this.client
      .put(
        `/storage/share/${payload.itemId}`,
        {
          timesValid: payload.timesValid,
          active: payload.active,
        },
        this.headers()
      );
  }

  /**
   * Delete share link by id
   * @param payload
   */
   public deleteShareLink(shareId: string): Promise<{deleted: boolean, shareId: string}> {
    return this.client
      .delete(
        `/storage/share/${shareId}`,
        this.headers()
      );
  }

  /**
   * Fetches data of a shared file
   * @param token
   */
  public getShareLink(token: string): Promise<ShareLink> {
    return this.client
      .get(
        `/storage/share/${token}`,
        this.basicHeaders()
      );
  }

  /**
   * Fetches paginated folders or files of a specific share link
   * @param payload
   */
  public getShareLinkDirectory(payload: GetSharedDirectoryPayload): Promise<any> {
    const types = ['file', 'folder'];
    if(!types.includes(payload.type)) {
      throw new Error('Invalid type');
    }
    return this.client
      .get(
        // eslint-disable-next-line max-len
        `/storage/share/down/${payload.type}s?token=${payload.token}&folderId=${payload.folderId}&page=${payload.page}&perPage=${payload.perPage}${payload.code ?  '&code=' + payload.code : ''}`,
        this.basicHeaders()
      );
  }
  

  /**
   * Get size of folder in share links
   * @param payload
   */
   public getShareLinkFolderSize(payload: GetShareLinkFolderSizePayload): Promise<any> {
    return this.client
      .get(
        `/storage/share/${payload.itemId}/folder/${payload.folderId}/size`,
        this.basicHeaders()
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

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private basicHeaders() {
    return basicHeaders(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
    );
  }
}