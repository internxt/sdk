import ErrorCode, { CodeError } from './codes';

export class DownloadInvalidMnemonicError extends CodeError {
  constructor() {
    super(ErrorCode.Download.InvalidMnemonic, 'Invalid mnemonic received');

    Object.setPrototypeOf(this, DownloadInvalidMnemonicError.prototype);
  }
}
