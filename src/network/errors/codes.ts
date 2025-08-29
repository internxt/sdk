/**
 * NETWORK ERROR CODES FORMAT: 1****
 * -UPLOAD ERRORS:              1***
 * -DOWNLOAD ERRORS:            2***
 * -CRYPTOGRAPHIC ERRORS:        1**
 *
 */
enum UploadErrorCode {
  InvalidMnemonic = 11100,
}

enum DownloadErrorCode {
  InvalidMnemonic = 12100,
}

type NetworkErrorCode = UploadErrorCode | DownloadErrorCode;

export class CodeError extends Error {
  constructor(
    public code: NetworkErrorCode,
    public message: string,
  ) {
    super(message);
  }
}

export default {
  Upload: UploadErrorCode,
  Download: DownloadErrorCode,
};
