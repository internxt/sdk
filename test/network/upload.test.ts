import sinon from 'sinon';
import { randomBytes } from 'crypto';

import { ALGORITHMS, Network, Crypto } from '../../src/network';
import { uploadFile } from '../../src/network/upload';
import { UploadInvalidMnemonicError } from '../../src/network/errors';

const fakeFileId = 'aaaaaa';
const fakeBucketId = 'fake-bucket-id';
const fakeHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const fakeMnemonic = 'test test test test test test test test';
const crypto: Crypto = {
  validateMnemonic: () => {
    return false;
  },
  algorithm: ALGORITHMS.AES256CTR,
  generateFileKey: async (mnemonic) => {
    return Buffer.from(mnemonic);
  },
  randomBytes
};
const network = Network.client('fake.com', {
  clientName: 'sdk',
  clientVersion: '1.0',
}, {
  bridgeUser: '',
  userId: ''
});

afterEach(() => {
  sinon.restore();
});

describe('network/upload', () => {
  describe('uploadFile()', () => {
    it('Should work properly if all is fine', async () => {
      const fileId = fakeFileId;
      const bucketId = fakeBucketId;
      const mnemonic = fakeMnemonic;
      const fileSize = 1000;

      const fakeUrl = 'http://x.com';
      const fakeFilename = 'eeeeeee';
      const fakeUuid = 'b541b138-a6f2-4729-8d20-8e6011cb8216';

      const index = 'aabdfb3018eb9e93bd9a31936aad979bed83abcc60fd79c15c15f44321024f46';
      const bufferizedIndex = Buffer.from(index, 'hex');
      const key = Buffer.from('');

      const randomBytesStub = sinon.stub(crypto, 'randomBytes').returns(bufferizedIndex);
      const generateFileKeyStub = sinon.stub(crypto, 'generateFileKey').resolves(key);
      const validateMnemonicStub = sinon.stub(crypto, 'validateMnemonic').returns(true);
      const startUploadStub = sinon.stub(network, 'startUpload').resolves({
        uploads: [{
          url: fakeUrl,
          uuid: fakeUuid,
          index: 0,
          urls: null,
        }]
      });
      const finishUploadStub = sinon.stub(network, 'finishUpload').resolves({
        bucket: '',
        created: new Date(),
        id: fileId,
        index,
        mimetype: 'application/octet-stream',
        name: fakeFilename
      });

      const encryptFileMock = jest.fn();
      const uploadFileMock = jest.fn().mockReturnValue(fakeHash);

      try {
        const receivedFileId = await uploadFile(
          network,
          crypto,
          bucketId,
          mnemonic,
          fileSize,
          encryptFileMock,
          uploadFileMock
        );

        expect(validateMnemonicStub.calledOnce).toBeTruthy();
        expect(validateMnemonicStub.firstCall.args).toStrictEqual([mnemonic]);

        expect(randomBytesStub.calledOnce).toBeTruthy();
        expect(randomBytesStub.firstCall.args).toStrictEqual([ALGORITHMS.AES256CTR.ivSize]);

        expect(generateFileKeyStub.calledOnce).toBeTruthy();
        expect(generateFileKeyStub.firstCall.args).toStrictEqual([mnemonic, bucketId, bufferizedIndex]);

        expect(startUploadStub.calledOnce).toBeTruthy();
        expect(startUploadStub.firstCall.args).toStrictEqual([bucketId, {
          uploads: [{
            index: 0,
            size: fileSize
          }]
        }]);

        expect(encryptFileMock).toBeCalledTimes(1);
        expect(encryptFileMock).toHaveBeenCalledWith(
          ALGORITHMS.AES256CTR.type,
          key,
          bufferizedIndex.slice(0, 16)
        );

        expect(uploadFileMock).toBeCalledTimes(1);
        expect(uploadFileMock).toHaveBeenCalledWith(fakeUrl);

        expect(finishUploadStub.calledOnce).toBeTruthy();
        expect(finishUploadStub.firstCall.args).toStrictEqual([bucketId, {
          index,
          shards: [{
            hash: fakeHash,
            uuid: fakeUuid
          }]
        }]);

        expect(receivedFileId).toEqual(fileId);
      } catch (err) {
        expect(true).toBeFalsy();
      }
    });

    it('Should throw if the mnemonic is invalid', async () => {
      const bucketId = fakeBucketId;
      const mnemonic = fakeMnemonic;
      const fileSize = 1000;

      const validateMnemonic = sinon.stub(crypto, 'validateMnemonic').returns(false);
      const randomBytes = sinon.stub(crypto, 'randomBytes').returns(Buffer.from(''));

      try {
        await uploadFile(
          network,
          crypto,
          bucketId,
          mnemonic,
          fileSize,
          jest.fn(),
          jest.fn()
        );

        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBeInstanceOf(UploadInvalidMnemonicError);

        expect(validateMnemonic.calledOnce).toBeTruthy();
        expect(validateMnemonic.firstCall.args).toStrictEqual([mnemonic]);

        expect(randomBytes.callCount).toEqual(0);
      }
    });
  });
});
