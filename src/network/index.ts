import {
  BridgeUrl,
  StartUploadResponse,
  FinishUploadResponse,
  GetDownloadLinksResponse,
  NetworkRequestConfig,
  FinishUploadPayload,
} from './types';
import { ApiUrl, AppDetails } from '../shared';
import { HttpClient } from '../shared/http/client';
import { headersWithBasicAuth } from '../shared/headers/index';
import { BasicAuth } from '../auth/types';
import { StartUploadPayload } from './types';

export * from './types';

export class Network {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly auth: BasicAuth;

  public static client(apiUrl: BridgeUrl, appDetails: AppDetails, opts: { bridgeUser: string; userId: string }) {
    return new Network(apiUrl, appDetails, opts);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, opts: { bridgeUser: string; userId: string }) {
    this.client = HttpClient.create(apiUrl);
    this.appDetails = appDetails;
    this.auth = {
      username: opts.bridgeUser,
      password: opts.userId,
    };
  }

  public startUpload(idBucket: string, payload: StartUploadPayload): Promise<StartUploadResponse> {
    return Network.startUpload(idBucket, payload, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  public finishUpload(idBucket: string, payload: FinishUploadPayload): Promise<FinishUploadResponse> {
    return Network.finishUpload(idBucket, payload, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  public getDownloadLinks(idBucket: string, file: string): Promise<GetDownloadLinksResponse> {
    return Network.getDownloadLinks(idBucket, file, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  /**
   * Creates entries for every upload in the request, returns the urls to upload
   * @param idBucket
   * @param uploads
   */
  private static startUpload(
    idBucket: string,
    payload: StartUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<StartUploadResponse>(`/v2/buckets/${idBucket}/files/start`, payload, headers);
  }

  /**
   * Finishes the upload of a file
   * @param idBucket
   * @param index
   * @param shards
   */
  private static finishUpload(
    idBucket: string,
    payload: FinishUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<FinishUploadResponse>(`/v2/buckets/${idBucket}/files/finish`, payload, headers);
  }

  /**
   * Gets the download links for a file
   * @param idBucket
   * @param file
   */
  private static getDownloadLinks(idBucket: string, file: string, { client, appDetails, auth }: NetworkRequestConfig) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.get<GetDownloadLinksResponse>(`/v2/buckets/${idBucket}/files/${file}/mirrors`, headers);
  }

  /**
   * Gets headers with basic auth
   * @param appDetails
   * @param auth
   */
  private static headersWithBasicAuth(appDetails: AppDetails, auth: BasicAuth) {
    return headersWithBasicAuth(appDetails.clientName, appDetails.clientVersion, auth);
  }
}
