import { Axios } from 'axios';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { GenerateShareLinkPayload, GetShareInfoResponse, IShare } from './types';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { ApiModule } from '../../shared/modules';
import { getDriveAxiosClient } from '../shared/axios';

export * as ShareTypes from './types';

export class Share extends ApiModule {
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    const axios = getDriveAxiosClient(apiUrl);
    return new Share(axios, appDetails, apiSecurity);
  }

  private constructor(axios: Axios, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    super(axios);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Creates a new link to share a file
   * @param payload
   */
  public createShareLink(payload: GenerateShareLinkPayload): Promise<{
    token: string
  }> {
    return this.axios
      .post(`/storage/share/file/${payload.fileId}`, {
        isFolder: payload.isFolder,
        views: payload.views,
        encryptionKey: payload.encryptionKey,
        fileToken: payload.fileToken,
        bucket: payload.bucket,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Fetches info about a specific share
   * @param token
   */
  public getShareByToken(token: string): Promise<GetShareInfoResponse> {
    return this.axios
      .get(`/storage/share/${token}`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Fetches the list of shared items
   */
  public getShareList(): Promise<IShare> {
    return this.axios
      .get('/share/list', {
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