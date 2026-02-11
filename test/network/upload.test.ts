import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'crypto';

import { ALGORITHMS, Network, Crypto } from '../../src/network';
import { uploadFile } from '../../src/network/upload';
import { UploadInvalidMnemonicError } from '../../src/network/errors';
import { fail } from 'assert';

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
  randomBytes,
};
const network = Network.client(
  'fake.com',
  {
    clientName: 'sdk',
    clientVersion: '1.0',
  },
  {
    bridgeUser: '',
    userId: '',
  },
);

describe('network/upload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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

      const randomBytesStub = vi.spyOn(crypto, 'randomBytes').mockReturnValue(bufferizedIndex);
      const generateFileKeyStub = vi.spyOn(crypto, 'generateFileKey').mockResolvedValue(key);
      const validateMnemonicStub = vi.spyOn(crypto, 'validateMnemonic').mockReturnValue(true);
      const startUploadStub = vi.spyOn(network, 'startUpload').mockResolvedValue({
        uploads: [
          {
            url: fakeUrl,
            uuid: fakeUuid,
            index: 0,
            urls: null,
          },
        ],
      });
      const finishUploadStub = vi.spyOn(network, 'finishUpload').mockResolvedValue({
        bucket: '',
        created: new Date(),
        id: fileId,
        index,
        mimetype: 'application/octet-stream',
        name: fakeFilename,
      });

      const encryptFileMock = vi.fn();
      const uploadFileMock = vi.fn().mockReturnValue(fakeHash);

      try {
        const receivedFileId = await uploadFile(
          network,
          crypto,
          bucketId,
          mnemonic,
          fileSize,
          encryptFileMock,
          uploadFileMock,
        );

        expect(validateMnemonicStub).toHaveBeenCalledOnce();
        expect(validateMnemonicStub).toHaveBeenCalledWith(mnemonic);

        expect(randomBytesStub).toHaveBeenCalledOnce();
        expect(randomBytesStub).toHaveBeenCalledWith(ALGORITHMS.AES256CTR.ivSize);

        expect(generateFileKeyStub).toHaveBeenCalledOnce();
        expect(generateFileKeyStub).toHaveBeenCalledWith(mnemonic, bucketId, bufferizedIndex);

        expect(startUploadStub).toHaveBeenCalledOnce();
        expect(startUploadStub).toHaveBeenCalledWith(bucketId, {
          uploads: [
            {
              index: 0,
              size: fileSize,
            },
          ],
        });

        expect(encryptFileMock).toHaveBeenCalledTimes(1);
        expect(encryptFileMock).toHaveBeenCalledWith(ALGORITHMS.AES256CTR.type, key, bufferizedIndex.slice(0, 16));

        expect(uploadFileMock).toHaveBeenCalledTimes(1);
        expect(uploadFileMock).toHaveBeenCalledWith(fakeUrl);

        expect(finishUploadStub).toHaveBeenCalledOnce();
        expect(finishUploadStub).toHaveBeenCalledWith(bucketId, {
          index,
          shards: [
            {
              hash: fakeHash,
              uuid: fakeUuid,
            },
          ],
        });

        expect(receivedFileId).toEqual(fileId);
      } catch {
        fail('Expected function to not throw an error, but it did.');
      }
    });

    it('Should throw if the mnemonic is invalid', async () => {
      const bucketId = fakeBucketId;
      const mnemonic = fakeMnemonic;
      const fileSize = 1000;

      const validateMnemonic = vi.spyOn(crypto, 'validateMnemonic').mockReturnValue(false);
      const randomBytes = vi.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.from(''));

      try {
        await uploadFile(network, crypto, bucketId, mnemonic, fileSize, vi.fn(), vi.fn());

        fail('Expected function to throw an error, but it did not.');
      } catch (err) {
        expect(err).toBeInstanceOf(UploadInvalidMnemonicError);

        expect(validateMnemonic).toHaveBeenCalledOnce();
        expect(validateMnemonic).toHaveBeenCalledWith(mnemonic);

        expect(randomBytes).not.toHaveBeenCalled();
      }
    });
  });
});
