import { DownloadInvalidMnemonicError } from './download';
import { UploadInvalidMnemonicError } from './upload';

type NetworkError = UploadInvalidMnemonicError | DownloadInvalidMnemonicError | Error;
export type NetworkUploadContext = {
  bucketId: string;
  fileSize: number;
  user: string;
};
export type NetworkDownloadContext = {
  bucketId: string;
  fileId: string;
  user: string;
};

export type NetworkContext = NetworkUploadContext | NetworkDownloadContext;

export class ErrorWithContext extends Error {
  constructor(public context: Partial<NetworkContext>) {
    super();
  }
}

export function getNetworkErrorContext(input: NetworkContext, err: NetworkError): Partial<NetworkContext> {
  const output = Object.assign({}, input);

  return output;
}
