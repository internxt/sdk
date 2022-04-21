import { Network } from '.';
import {
  Crypto,
  BinaryDataEncoding,
  DecryptFileFunction,
  DownloadFileFunction,
  ToBinaryDataFunction,
} from './types';

export class FileVersionOneError extends Error {
  constructor() {
    super('File version 1');

    Object.setPrototypeOf(this, FileVersionOneError.prototype);
  }
}

export async function downloadFile(
  fileId: string,
  bucketId: string,
  mnemonic: string,
  network: Network,
  crypto: Crypto,
  toBinaryData: ToBinaryDataFunction,
  downloadFile: DownloadFileFunction,
  decryptFile: DecryptFileFunction
): Promise<void> {
  const { index, shards, version, size } = await network.getDownloadLinks(bucketId, fileId);

  if (!version || version === 1) {
    throw new FileVersionOneError();
  }

  const iv = toBinaryData(index, BinaryDataEncoding.HEX).slice(0, 16);
  const key = await crypto.generateFileKey(mnemonic, bucketId, toBinaryData(index, BinaryDataEncoding.HEX));
  const downloadables = shards.sort((sA, sB) => sA.index - sB.index);

  await downloadFile(downloadables, size);
  await decryptFile(crypto.algorithm.type, key, iv, size);
}
