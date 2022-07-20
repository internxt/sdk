import ErrorCode, { CodeError } from './codes';

export class UploadInvalidMnemonicError extends CodeError {
  constructor() {
    super(ErrorCode.Upload.InvalidMnemonic, 'Invalid mnemonic received');

    Object.setPrototypeOf(this, UploadInvalidMnemonicError.prototype);
  }
}

export class UrlNotReceivedFromNetworkError extends CodeError {
  constructor() {
    super(ErrorCode.Upload.InvalidMnemonic, 'Url not received from network');

    Object.setPrototypeOf(this, UrlNotReceivedFromNetworkError.prototype);
  }
}

export class UrlsNotReceivedFromNetworkError extends CodeError {
  constructor() {
    super(ErrorCode.Upload.InvalidMnemonic, 'Urls not received from network');

    Object.setPrototypeOf(this, UrlsNotReceivedFromNetworkError.prototype);
  }
}
export class UploadIdNotReceivedFromNetworkError extends CodeError {
  constructor() {
    super(ErrorCode.Upload.InvalidMnemonic, 'UploadId not receievd from network');

    Object.setPrototypeOf(this, UploadIdNotReceivedFromNetworkError.prototype);
  }
}
