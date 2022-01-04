import axios, { AxiosStatic } from 'axios';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { GenerateShareLinkPayload, GetShareInfoResponse, IShare } from './types';
import { ApiSecureConnectionDetails } from '../../shared/types/apiConnection';

export * as ShareTypes from './types';

export class Share {
  private readonly axios: AxiosStatic;
  private readonly apiDetails: ApiSecureConnectionDetails;

  public static client(apiDetails: ApiSecureConnectionDetails) {
    return new Share(axios, apiDetails);
  }

  constructor(axios: AxiosStatic, apiDetails: ApiSecureConnectionDetails) {
    this.axios = axios;
    this.apiDetails = apiDetails;
  }

  /**
   * Creates a new link to share a file
   * @param payload
   */
  public createShareLink(payload: GenerateShareLinkPayload): Promise<{
    token: string
  }> {
    return this.axios
      .post(`${this.apiDetails.url}/api/storage/share/file/${payload.fileId}`, {
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
      .get(`${this.apiDetails.url}/api/storage/share/${token}`, {
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
      .get(`${this.apiDetails.url}/api/share/list`, {
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