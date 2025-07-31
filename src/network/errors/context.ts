import { DownloadInvalidMnemonicError } from './download';
import { UploadInvalidMnemonicError } from './upload';

export type NetworkUploadContext = {
  bucketId: string;
  fileSize: number;
  user: string;
  crypto: {
    mnemonic?: string;
  }
}
export type NetworkDownloadContext = {
  bucketId: string;
  fileId: string;
  user: string;
  crypto: {
    mnemonic?: string;
  }
}

export type NetworkContext = NetworkUploadContext | NetworkDownloadContext;

export class ErrorWithContext extends Error {
  constructor(public context: NetworkContext) {
    super();
  }
}

export function getNetworkErrorContext(input: NetworkContext, err: unknown): NetworkContext {
  const output = Object.assign({}, input);

  delete output.crypto.mnemonic;

  if (err instanceof UploadInvalidMnemonicError || err instanceof DownloadInvalidMnemonicError) {
    output.crypto.mnemonic = input.crypto.mnemonic;
  }

  return output;
}
