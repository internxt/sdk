import { validate as uuidValidate } from 'uuid';
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
import { isHexString } from '../utils';

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

  public startUpload(bucketId: string, payload: StartUploadPayload): Promise<StartUploadResponse> {
    for (const { index, size } of payload.uploads) {
      if (index < 0) {
        throw new Error('Invalid index');
      }
      if (size < 0) {
        throw new Error('Invalid size');
      }
    }
    return Network.startUpload(idBucket, payload, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  public finishUpload(bucketId: string, payload: FinishUploadPayload): Promise<FinishUploadResponse> {
    const { index, shards } = payload;
    if (!isHexString(index) || index.length !== 64) {
      throw new Error('Invalid index');
    }

    for (const shard of shards) {
      if (!uuidValidate(shard.uuid)) {
        throw new Error('Invalid UUID');
      }
    }

    return Network.finishUpload(bucketId, payload, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  public getDownloadLinks(bucketId: string, fileId: string): Promise<GetDownloadLinksResponse> {
    return Network.getDownloadLinks(bucketId, fileId, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  public async deleteFile(bucketId: string, fileId: string): Promise<void> {
    await Network.deleteFile(bucketId, fileId, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  /**
   * Creates entries for every upload in the request, returns the urls to upload
   * @param bucketId
   * @param uploads
   */
  static startUpload(
    bucketId: string,
    payload: StartUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<StartUploadResponse>(`/v2/buckets/${bucketId}/files/start`, payload, headers);
  }

  /**
   * Finishes the upload of a file
   * @param bucketId
   * @param index
   * @param shards
   */
  private static finishUpload(
    bucketId: string,
    payload: FinishUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<FinishUploadResponse>(`/v2/buckets/${bucketId}/files/finish`, payload, headers);
  }

  /**
   * Gets the download links for a file
   * @param bucketId
   * @param file
   */
  private static getDownloadLinks(
    bucketId: string,
    fileId: string,
    { client, appDetails, auth }: NetworkRequestConfig,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.get<GetDownloadLinksResponse>(`/v2/buckets/${bucketId}/files/${fileId}/mirrors`, headers);
  }

  /**
   * Deletes a file
   * @param bucketId
   * @param file
   */
  private static deleteFile(bucketId: string, fileId: string, { client, appDetails, auth }: NetworkRequestConfig) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.delete(`/v2/buckets/${bucketId}/files/${fileId}`, headers);
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
