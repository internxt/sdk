import { UploadRequest, UploadResponse, Shard, BridgeUrl, StartUploadResponse, FinishUploadResponse } from './types';
import { ApiUrl, AppDetails } from '../shared';
import { HttpClient } from '../shared/http/client';
import { headersWithBasicAuth } from '../shared/headers/index';
import { BasicAuth } from '../auth/types';
import { GetDownloadLinksResponse } from './types';

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

  public startUpload(idBucket: string, uploads: UploadRequest[]): Promise<StartUploadResponse> {
    return Network.startUpload(
      { idBucket, uploads },
      { client: this.client, appDetails: this.appDetails, auth: this.auth },
    );
  }

  public finishUpload(idBucket: string, index: string, shards: Shard[]): Promise<FinishUploadResponse> {
    return Network.finishUpload(
      { idBucket, index, shards },
      { client: this.client, appDetails: this.appDetails, auth: this.auth },
    );
  }

  public getDownloadLinks(idBucket: string, file: string): Promise<GetDownloadLinksResponse> {
    return Network.getDownloadLinks(
      { idBucket, file },
      { client: this.client, appDetails: this.appDetails, auth: this.auth },
    );
  }

  /**
   * Creates entries for every upload in the request, returns the urls to upload
   * @param idBucket
   * @param uploads
   */
  private static startUpload(
    { idBucket, uploads }: { idBucket: string; uploads: UploadRequest[] },
    { client, appDetails, auth }: { client: HttpClient; appDetails: AppDetails; auth: BasicAuth },
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<{
      uploads: UploadResponse[];
    }>(
      `/v2/buckets/${idBucket}/files/start`,
      {
        uploads,
      },
      headers,
    );
  }

  /**
   * Finishes the upload of a file
   * @param idBucket
   * @param index
   * @param shards
   */
  private static finishUpload(
    { idBucket, index, shards }: { idBucket: string; index: string; shards: Shard[] },
    { client, appDetails, auth }: { client: HttpClient; appDetails: AppDetails; auth: BasicAuth },
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<FinishUploadResponse>(
      `/v2/buckets/${idBucket}/files/finish`,
      {
        index,
        shards,
      },
      headers,
    );
  }

  /**
   * Gets the download links for a file
   * @param idBucket
   * @param file
   */
  private static getDownloadLinks(
    { idBucket, file }: { idBucket: string; file: string },
    { client, appDetails, auth }: { client: HttpClient; appDetails: AppDetails; auth: BasicAuth },
  ) {
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
