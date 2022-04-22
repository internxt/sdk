import ErrorCode, { CodeError } from './codes';

export class UploadInvalidMnemonicError extends CodeError {
  constructor() {
    super(ErrorCode.Upload.InvalidMnemonic, 'Invalid mnemonic received');

    Object.setPrototypeOf(this, UploadInvalidMnemonicError.prototype);
  }
}
