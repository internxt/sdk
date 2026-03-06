import { BasicAuth } from '../auth/types';
import { ApiUrl, AppDetails } from '../shared';
import { headersWithAuthToken, headersWithBasicAuth } from '../shared/headers/index';
import { HttpClient } from '../shared/http/client';
import { isHexString } from '../utils';
import {
  BridgeUrl,
  FinishMultipartUploadPayload,
  FinishUploadPayload,
  FinishUploadResponse,
  GetDownloadLinksResponse,
  NetworkRequestConfig,
  StartUploadPayload,
  StartUploadResponse,
} from './types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uuidValidate = (str: string): boolean => UUID_REGEX.test(str);

export * from './types';

export class InvalidFileIndexError extends Error {
  constructor() {
    super('Invalid file index');

    Object.setPrototypeOf(this, InvalidFileIndexError.prototype);
  }
}

export class InvalidUploadSizeError extends Error {
  constructor() {
    super('Invalid size');

    Object.setPrototypeOf(this, InvalidUploadSizeError.prototype);
  }
}

export class FileTooSmallForMultipartError extends Error {
  constructor() {
    super('File is too small for multipart upload');

    Object.setPrototypeOf(this, FileTooSmallForMultipartError.prototype);
  }
}

export class InvalidMultipartValueError extends Error {
  constructor() {
    super('Invalid multipart value');

    Object.setPrototypeOf(this, InvalidMultipartValueError.prototype);
  }
}

export class Network {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly auth: BasicAuth;

  static client(apiUrl: BridgeUrl, appDetails: AppDetails, opts: { bridgeUser: string; userId: string }) {
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

  get credentials(): BasicAuth {
    return this.auth;
  }

  async startUpload(bucketId: string, fileSize: number, signal?: AbortSignal, parts = 1): Promise<StartUploadResponse> {
    if (fileSize <= 0) {
      throw new InvalidUploadSizeError();
    }

    const MB100 = 100 * 1024 * 1024;
    if (fileSize < MB100 && parts > 1) {
      throw new FileTooSmallForMultipartError();
    }

    if (!Number.isInteger(parts) || parts < 1) {
      throw new InvalidMultipartValueError();
    }

    return await Network.startUpload(
      bucketId,
      { uploads: [{ index: 0, size: fileSize }] },
      {
        client: this.client,
        appDetails: this.appDetails,
        auth: this.auth,
      },
      signal,
      parts,
    );
  }

  async finishUpload(
    bucketId: string,
    payload: FinishUploadPayload,
    signal?: AbortSignal,
  ): Promise<FinishUploadResponse> {
    const { index, shards } = payload;
    if (!isHexString(index) || index.length !== 64) {
      throw new InvalidFileIndexError();
    }

    for (const shard of shards) {
      if (!uuidValidate(shard.uuid)) {
        throw new Error('Invalid UUID');
      }
    }

    return await Network.finishUpload(
      bucketId,
      payload,
      {
        client: this.client,
        appDetails: this.appDetails,
        auth: this.auth,
      },
      signal,
    );
  }

  async finishMultipartUpload(
    bucketId: string,
    payload: FinishMultipartUploadPayload,
    signal?: AbortSignal,
  ): Promise<FinishUploadResponse> {
    const { index, shards } = payload;
    if (!isHexString(index) || index.length !== 64) {
      throw new InvalidFileIndexError();
    }

    for (const shard of shards) {
      if (!uuidValidate(shard.uuid)) {
        throw new Error('Invalid UUID');
      }

      if (!shard.UploadId) {
        throw new Error('Missing UploadId');
      }
      if (!shard.parts) {
        throw new Error('Missing parts');
      }
    }

    return await Network.finishUpload(
      bucketId,
      payload,
      {
        client: this.client,
        appDetails: this.appDetails,
        auth: this.auth,
      },
      signal,
    );
  }

  async getDownloadLinks(bucketId: string, fileId: string, token?: string): Promise<GetDownloadLinksResponse> {
    return await Network.getDownloadLinks(
      bucketId,
      fileId,
      {
        client: this.client,
        appDetails: this.appDetails,
        auth: this.auth,
      },
      token,
    );
  }

  async deleteFile(bucketId: string, fileId: string): Promise<void> {
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
  static async startUpload(
    bucketId: string,
    payload: StartUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
    signal?: AbortSignal,
    parts = 1,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return await client.post<StartUploadResponse>(
      `/v2/buckets/${bucketId}/files/start?multiparts=${parts}`,
      payload,
      headers,
      signal,
    );
  }

  /**
   * Finishes the upload of a file
   * @param bucketId
   * @param index
   * @param shards
   */
  private static async finishUpload(
    bucketId: string,
    payload: FinishUploadPayload | FinishMultipartUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
    signal?: AbortSignal,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return await client.post<FinishUploadResponse>(`/v2/buckets/${bucketId}/files/finish`, payload, headers, signal);
  }

  /**
   * Gets the download links for a file
   * @param bucketId
   * @param file
   */
  private static async getDownloadLinks(
    bucketId: string,
    fileId: string,
    { client, appDetails, auth }: NetworkRequestConfig,
    token?: string,
  ) {
    // ES ESTE EL QUE FALLA AL INTENTAR DESCARGAR UN FILE
    const headers = token
      ? Network.headersWithAuthToken(appDetails, token)
      : Network.headersWithBasicAuth(appDetails, auth);

    return await client.get<GetDownloadLinksResponse>(`/buckets/${bucketId}/files/${fileId}/info`, {
      ...headers,
      'x-api-version': '2',
    });
  }

  /**
   * Deletes a file
   * @param bucketId
   * @param file
   */
  private static async deleteFile(
    bucketId: string,
    fileId: string,
    { client, appDetails, auth }: NetworkRequestConfig,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return await client.delete(`/v2/buckets/${bucketId}/files/${fileId}`, headers);
  }

  /**
   * Gets headers with basic auth
   * @param appDetails
   * @param auth
   */
  private static headersWithBasicAuth(appDetails: AppDetails, auth: BasicAuth) {
    return headersWithBasicAuth({
      clientName: appDetails.clientName,
      clientVersion: appDetails.clientVersion,
      auth,
      desktopToken: appDetails.desktopHeader,
      customHeaders: appDetails.customHeaders,
    });
  }

  private static headersWithAuthToken(appDetails: AppDetails, token: string) {
    return headersWithAuthToken({
      clientName: appDetails.clientName,
      clientVersion: appDetails.clientVersion,
      token,
      desktopToken: appDetails.desktopHeader,
      customHeaders: appDetails.customHeaders,
    });
  }
}
