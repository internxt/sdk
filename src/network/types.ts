import { AppDetails } from 'src/shared';
import { HttpClient } from '../shared/http/client';
import { BasicAuth } from '../auth/types';
export type BridgeUrl = string;

export interface Shard {
  uuid: string;
  hash: string;
}

export interface StartUploadResponse {
  uploads: { index: number; uuid: string; url: string }[];
}

export interface FinishUploadResponse {
  id: string;
  index: string;
  frame: string;
  bucket: string;
  name: string;
  mimetype: string;
  created: Date;
}

interface ShardResponse {
  index: string;
  size: number;
  hash: string;
  url: string;
}

export interface GetDownloadLinksResponse {
  bucket: string;
  index: string;
  created: Date;
  shards: ShardResponse[];
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
