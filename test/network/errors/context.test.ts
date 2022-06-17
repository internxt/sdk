import {
  NetworkUploadContext,
  NetworkDownloadContext,
  getNetworkErrorContext,
  DownloadInvalidMnemonicError,
  UploadInvalidMnemonicError
} from '../../../src/network/errors';

function getNetworkUploadContext(merge?: Partial<NetworkUploadContext>): NetworkUploadContext {
  const defaultContext: NetworkUploadContext = {
    bucketId: '',
    crypto: {
      index: 'index',
      iv: 'iv',
      key: 'key',
      mnemonic: 'mnemonic'
    },
    fileSize: 10,
    pass: 'pass',
    user: 'user'
  };

  return { ...defaultContext, ...merge };
}

function getNetworkDownloadContext(merge?: Partial<NetworkUploadContext>): NetworkDownloadContext {
  const defaultContext: NetworkDownloadContext = {
    bucketId: '',
    crypto: {
      index: 'index',
      iv: 'iv',
      key: 'key',
      mnemonic: 'mnemonic'
    },
    fileId: 'fileId',
    token: 'token',
    pass: 'pass',
    user: 'user'
  };

  return { ...defaultContext, ...merge };
}

describe('network/errors/context', () => {
  describe('Get download error context', () => {
    it('When the download error is not related to the mnemonic, the mnemonic is not included', async () => {
      const context = getNetworkDownloadContext();
      const error = new DownloadInvalidMnemonicError();

      const receivedContext = getNetworkErrorContext(context, error);
      const expectedContext = Object.assign({}, context);
      delete expectedContext.crypto.mnemonic;

      expect(receivedContext).toStrictEqual(expectedContext);
    });

    it('When the download error is due to an invalid mnemonic, the mnemonic is included', async () => {
      const expectedContext = getNetworkDownloadContext();
      const error = new DownloadInvalidMnemonicError();

      const receivedContext = getNetworkErrorContext(expectedContext, error);

      expect(receivedContext).toStrictEqual(expectedContext);
    });
  });

  describe('Get upload error context', () => {
    it('When the upload error is not related to the mnemonic, the mnemonic is not included', async () => {
      const context = getNetworkUploadContext();
      const error = new UploadInvalidMnemonicError();

      const receivedContext = getNetworkErrorContext(context, error);
      const expectedContext = Object.assign({}, context);
      delete expectedContext.crypto.mnemonic;

      expect(receivedContext).toStrictEqual(expectedContext);
    });

    it('When the upload error is due to an invalid mnemonic, the mnemonic is included', async () => {
      const expectedContext = getNetworkUploadContext();
      const error = new UploadInvalidMnemonicError();

      const receivedContext = getNetworkErrorContext(expectedContext, error);

      expect(receivedContext).toStrictEqual(expectedContext);
    });
  });
});
