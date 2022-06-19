import { AppDetails } from '../shared';
import { HttpClient } from '../shared/http/client';
import { BasicAuth } from '../auth/types';

type Hash = string;
export type BridgeUrl = string;

export interface Shard {
  uuid: string;
  hash: Hash;
}

export interface ShardForMultipart extends Shard {
  UploadId: string;
  parts: {
    PartNumber: number;
    ETag: string;
  }[];
}

export interface StartUploadResponse {
  uploads: { index: number; uuid: Shard['uuid']; url: string | null; urls: string[] | null; UploadId?: string }[];
}
export type FinishUploadResponse = BucketEntry;
export interface BucketEntry {
  id: string;
  index: string;
  bucket: string;
  name: string;
  mimetype: string;
  created: Date;
}

export interface DownloadableShard {
  index: number;
  size: number;
  hash: Shard['hash'];
  url: string;
}

export interface GetDownloadLinksResponse {
  bucket: string;
  index: string;
  created: Date;
  shards: DownloadableShard[];
  version?: number;
  size: number;
}

export interface NetworkRequestConfig {
  client: HttpClient;
  appDetails: AppDetails;
  auth: BasicAuth;
}

type UploadPayload = {
  index: number;
  size: number;
};

export type StartUploadPayload = {
  uploads: UploadPayload[];
};

export type FinishUploadPayload = {
  index: string;
  shards: Shard[];
};

export type FinishMultipartUploadPayload = {
  index: string;
  shards: ShardForMultipart[];
};

export type UploadFileFunction = (url: string) => Promise<Hash>;
export type UploadFileMultipartFunction = (
  urls: string[],
) => Promise<{ hash: Hash; parts: { PartNumber: number; ETag: string }[] }>;
export type DownloadFileFunction = (downloadables: DownloadableShard[], fileSize: number) => Promise<void>;

export type BinaryData = {
  slice: (from: number, to: number) => BinaryData;
  toString(encoding: 'hex'): string;
}

export enum BinaryDataEncoding {
  HEX = 'hex'
}

export type ToBinaryDataFunction = (input: string, encoding: BinaryDataEncoding) => BinaryData;


export enum SymmetricCryptoAlgorithm {
  AES256CTR = 'AES256CTR'
}

export type Algorithm = {
  type: SymmetricCryptoAlgorithm
  ivSize: number
};

export const ALGORITHMS: Record<SymmetricCryptoAlgorithm, Algorithm> = {
  [SymmetricCryptoAlgorithm.AES256CTR]: {
    type: SymmetricCryptoAlgorithm.AES256CTR,
    ivSize: 32
  }
};

export type Crypto = {
  algorithm: Algorithm;
  validateMnemonic: (mnemonic: string) => boolean;
  randomBytes: (bytesLength: number) => BinaryData;
  generateFileKey: (mnemonic: string, bucketId: string, index: BinaryData | string) => Promise<BinaryData>;
}

export type EncryptFileFunction = (
  algorithm: SymmetricCryptoAlgorithm,
  key: BinaryData,
  iv: BinaryData
) => Promise<void>;

export type DecryptFileFunction = (
  algorithm: SymmetricCryptoAlgorithm,
  key: BinaryData,
  iv: BinaryData,
  fileSize: number
) => Promise<void>;
