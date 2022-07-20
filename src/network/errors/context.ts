import { DownloadInvalidMnemonicError } from './download';
import { UploadInvalidMnemonicError } from './upload';

type NetworkError = UploadInvalidMnemonicError | DownloadInvalidMnemonicError | Error;
export type NetworkUploadContext = {
  bucketId: string;
  fileSize: number;
  user: string;
  pass: string;
  crypto: {
    index: string
    mnemonic?: string;
    key: string;
    iv: string
  }
}
export type NetworkDownloadContext = {
  bucketId: string;
  fileId: string;
  user: string;
  pass: string;
  token: string;
  crypto: {
    index: string
    mnemonic?: string;
    key: string;
    iv: string
  }
}

export type NetworkContext = NetworkUploadContext | NetworkDownloadContext;

export class ErrorWithContext extends Error {
  constructor(public context: Partial<NetworkContext>) {
    super();
  }
}

export function getNetworkErrorContext(input: NetworkContext, err: NetworkError): Partial<NetworkContext> {
  const output = Object.assign({}, input);

  delete output.crypto.mnemonic;

  if (err instanceof UploadInvalidMnemonicError || err instanceof DownloadInvalidMnemonicError) {
    output.crypto.mnemonic = input.crypto.mnemonic;
  }

  return output;
}
