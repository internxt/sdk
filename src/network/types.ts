export type BridgeUrl = string;

export interface UploadRequest {
  index: string;
  size: number;
}
export interface UploadResponse {
  index: string;
  uuid: string;
  url: string;
}

export interface Shard {
  uuid: string;
  hash: string;
}

export interface StartUploadResponse {
  uploads: UploadResponse[];
}

export interface FinishUploadResponse {
  // BucketEntry Model:
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
