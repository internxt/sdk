import { Network } from '.';
import { DownloadInvalidMnemonicError, ErrorWithContext, getNetworkErrorContext } from './errors';
import {
  Crypto,
  BinaryDataEncoding,
  DecryptFileFunction,
  DownloadFileFunction,
  ToBinaryDataFunction,
  BinaryData,
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
  decryptFile: DecryptFileFunction,
  opts?: { token: string },
): Promise<void> {
  let iv: BinaryData;
  let key: BinaryData;

  try {
    if (!opts?.token) {
      const mnemonicIsValid = crypto.validateMnemonic(mnemonic);

      if (!mnemonicIsValid) {
        throw new DownloadInvalidMnemonicError();
      }
    }

    const { index, shards, version, size } = await network.getDownloadLinks(bucketId, fileId, opts?.token);

    if (!version || version === 1) {
      throw new FileVersionOneError();
    }

    iv = toBinaryData(index, BinaryDataEncoding.HEX).slice(0, 16);
    key = await crypto.generateFileKey(mnemonic, bucketId, toBinaryData(index, BinaryDataEncoding.HEX));
    const downloadables = shards.sort((sA, sB) => sA.index - sB.index);

    await downloadFile(downloadables, size);
    await decryptFile(crypto.algorithm.type, key, iv, size);
  } catch (err) {
    const context = getNetworkErrorContext({
      bucketId,
      fileId,
      user: network.credentials.username,
    });

    (err as ErrorWithContext).context = context;

    throw err;
  }
}
