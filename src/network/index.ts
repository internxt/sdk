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

export class DuplicatedIndexesError extends Error {
  constructor() {
    super('Duplicated indexes found');

    Object.setPrototypeOf(this, DuplicatedIndexesError.prototype);
  }
}

export class InvalidFileIndexError extends Error {
  constructor() {
    super('Invalid file index');

    Object.setPrototypeOf(this, InvalidFileIndexError.prototype);
  }
}

export class InvalidUploadIndexError extends Error {
  constructor() {
    super('Invalid upload index');

    Object.setPrototypeOf(this, InvalidUploadIndexError.prototype);
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

  startUpload(bucketId: string, payload: StartUploadPayload, parts = 1): Promise<StartUploadResponse> {
    let totalSize = 0;

    for (const { index, size } of payload.uploads) {
      if (index < 0) {
        throw new InvalidUploadIndexError();
      }
      if (size < 0) {
        throw new InvalidUploadSizeError();
      }
      totalSize += size;
    }

    const MB100 = 100 * 1024 * 1024;
    if (totalSize < MB100 && parts > 1) {
      throw new FileTooSmallForMultipartError();
    }

    if (!Number.isInteger(parts) || parts < 1) {
      throw new InvalidMultipartValueError();
    }

    const uploadIndexesWithoutDuplicates = new Set(payload.uploads.map((upload) => upload.index));

    if (uploadIndexesWithoutDuplicates.size < payload.uploads.length) {
      throw new DuplicatedIndexesError();
    }

    return Network.startUpload(
      bucketId,
      payload,
      {
        client: this.client,
        appDetails: this.appDetails,
        auth: this.auth,
      },
      parts,
    );
  }

  finishUpload(bucketId: string, payload: FinishUploadPayload): Promise<FinishUploadResponse> {
    const { index, shards } = payload;
    if (!isHexString(index) || index.length !== 64) {
      throw new InvalidFileIndexError();
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

  finishMultipartUpload(bucketId: string, payload: FinishMultipartUploadPayload): Promise<FinishUploadResponse> {
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

    return Network.finishUpload(bucketId, payload, {
      client: this.client,
      appDetails: this.appDetails,
      auth: this.auth,
    });
  }

  getDownloadLinks(bucketId: string, fileId: string, token?: string): Promise<GetDownloadLinksResponse> {
    return Network.getDownloadLinks(
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
  static startUpload(
    bucketId: string,
    payload: StartUploadPayload,
    { client, appDetails, auth }: NetworkRequestConfig,
    parts = 1,
  ) {
    const headers = Network.headersWithBasicAuth(appDetails, auth);
    return client.post<StartUploadResponse>(
      `/v2/buckets/${bucketId}/files/start?multiparts=${parts}`,
      payload,
      headers,
    );
  }

  /**
   * Finishes the upload of a file
   * @param bucketId
   * @param index
   * @param shards
   */
  private static finishUpload(
    bucketId: string,
    payload: FinishUploadPayload | FinishMultipartUploadPayload,
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
    token?: string,
  ) {
    // ES ESTE EL QUE FALLA AL INTENTAR DESCARGAR UN FILE
    const headers = token
      ? Network.headersWithAuthToken(appDetails, token)
      : Network.headersWithBasicAuth(appDetails, auth);

    return client.get<GetDownloadLinksResponse>(`/buckets/${bucketId}/files/${fileId}/info`, {
      ...headers,
      'x-api-version': '2',
    });
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
