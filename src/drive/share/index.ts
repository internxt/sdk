import axios, { AxiosStatic } from 'axios';
import { Token } from '../../auth';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { GenerateShareLinkPayload, GetShareInfoResponse } from './types';

export * as ShareTypes from './types';

export class Share {
  private readonly axios: AxiosStatic;
  private readonly apiUrl: string;
  private readonly clientName: string;
  private readonly clientVersion: string;
  private readonly token: Token;
  private readonly mnemonic: string;

  public static client(
    apiUrl: string, clientName: string, clientVersion: string, token: Token, mnemonic: string
  ) {
    return new Share(axios, apiUrl, clientName, clientVersion, token, mnemonic);
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
   * Generates a new link to share a file
   * @param payload
   */
  public generateShareLink(payload: GenerateShareLinkPayload): Promise<{
    token: string
  }> {
    return this.axios
      .post(`${this.apiUrl}/api/storage/share/file/${payload.fileId}`, {
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
   * Fetches info about a specific token
   * @param token
   */
  public getShareTokenInfo(token: string): Promise<GetShareInfoResponse> {
    return this.axios
      .get(`${this.apiUrl}/api/storage/share/${token}`, {
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

}