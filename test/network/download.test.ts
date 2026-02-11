import { beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'crypto';

import { ALGORITHMS, BinaryDataEncoding, Crypto, DownloadableShard, Network } from '../../src/network';
import { downloadFile, FileVersionOneError } from '../../src/network/download';
import { DownloadInvalidMnemonicError } from '../../src/network/errors';
import { fail } from 'assert';

const fakeFileId = 'fake-file-id';
const fakeBucketId = 'fake-bucket-id';
const fakeHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const fakeMnemonic = 'test test test test test test test test';
const crypto: Crypto = {
  validateMnemonic: () => {
    return true;
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

describe('network/download', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadFile()', () => {
    describe('Should work properly if all is fine', () => {
      it('Should work when the mnemonic is provided', async () => {
        const fileId = fakeFileId;
        const bucketId = fakeBucketId;
        const mnemonic = fakeMnemonic;
        const index = 'aabdfb3018eb9e93bd9a31936aad979bed83abcc60fd79c15c15f44321024f46';
        const bufferizedIndex = Buffer.from(index, 'hex');
        const key = Buffer.from('');

        const shards: DownloadableShard[] = [
          {
            index: 0,
            hash: fakeHash,
            size: 1,
            url: 'https://fake.com',
          },
          {
            index: 1,
            hash: fakeHash,
            size: 1,
            url: 'https://fake.com',
          },
        ];

        const fileSize = shards.reduce((a, s) => a + s.size, 0);
        const validateMnemonicStub = vi.spyOn(crypto, 'validateMnemonic').mockReturnValue(true);
        const generateFileKeyStub = vi.spyOn(crypto, 'generateFileKey').mockResolvedValue(key);
        const getDownloadLinksStub = vi.spyOn(network, 'getDownloadLinks').mockResolvedValue({
          index,
          shards,
          version: 2,
          bucket: bucketId,
          created: new Date(),
          size: fileSize,
        });

        const toBinaryDataMock = vi.fn().mockReturnValue(bufferizedIndex);
        const downloadFileMock = vi.fn();
        const decryptFileMock = vi.fn();

        try {
          await downloadFile(
            fileId,
            bucketId,
            mnemonic,
            network,
            crypto,
            toBinaryDataMock,
            downloadFileMock,
            decryptFileMock,
          );

          expect(validateMnemonicStub).toHaveBeenCalledOnce();
          expect(validateMnemonicStub).toHaveBeenCalledWith(mnemonic);

          expect(getDownloadLinksStub).toHaveBeenCalledOnce();
          expect(getDownloadLinksStub).toHaveBeenCalledWith(bucketId, fileId, undefined);

          expect(toBinaryDataMock).toHaveBeenCalledTimes(2);
          expect(toBinaryDataMock).toHaveBeenCalledWith(index, BinaryDataEncoding.HEX);
          expect(toBinaryDataMock).toHaveBeenCalledWith(index, BinaryDataEncoding.HEX);

          expect(generateFileKeyStub).toHaveBeenCalledOnce();
          expect(generateFileKeyStub).toHaveBeenCalledWith(mnemonic, bucketId, bufferizedIndex);

          expect(downloadFileMock).toHaveBeenCalledTimes(1);
          expect(downloadFileMock).toHaveBeenCalledWith(shards, fileSize);

          expect(decryptFileMock).toHaveBeenCalledTimes(1);
          expect(decryptFileMock).toHaveBeenCalledWith(
            crypto.algorithm.type,
            key,
            bufferizedIndex.slice(0, 16),
            fileSize,
          );
        } catch {
          fail('Expected function to not throw an error, but it did.');
        }
      });

      it('Should work if the token is provided', async () => {
        const fileId = fakeFileId;
        const bucketId = fakeBucketId;
        const mnemonic = fakeMnemonic;
        const token = 'a-token';
        const index = 'aabdfb3018eb9e93bd9a31936aad979bed83abcc60fd79c15c15f44321024f46';
        const bufferizedIndex = Buffer.from(index, 'hex');
        const key = Buffer.from('');

        const shards: DownloadableShard[] = [
          {
            index: 0,
            hash: fakeHash,
            size: 1,
            url: 'https://fake.com',
          },
          {
            index: 1,
            hash: fakeHash,
            size: 1,
            url: 'https://fake.com',
          },
        ];

        const fileSize = shards.reduce((a, s) => a + s.size, 0);
        const validateMnemonicStub = vi.spyOn(crypto, 'validateMnemonic').mockReturnValue(true);
        const generateFileKeyStub = vi.spyOn(crypto, 'generateFileKey').mockResolvedValue(key);
        const getDownloadLinksStub = vi.spyOn(network, 'getDownloadLinks').mockResolvedValue({
          index,
          shards,
          version: 2,
          bucket: bucketId,
          created: new Date(),
          size: fileSize,
        });

        const toBinaryDataMock = vi.fn().mockReturnValue(bufferizedIndex);
        const downloadFileMock = vi.fn();
        const decryptFileMock = vi.fn();

        try {
          await downloadFile(
            fileId,
            bucketId,
            mnemonic,
            network,
            crypto,
            toBinaryDataMock,
            downloadFileMock,
            decryptFileMock,
            { token },
          );

          expect(validateMnemonicStub).not.toHaveBeenCalled();

          expect(getDownloadLinksStub).toHaveBeenCalledOnce();
          expect(getDownloadLinksStub).toHaveBeenCalledWith(bucketId, fileId, token);

          expect(toBinaryDataMock).toHaveBeenCalledTimes(2);
          expect(toBinaryDataMock).toHaveBeenCalledWith(index, BinaryDataEncoding.HEX);
          expect(toBinaryDataMock).toHaveBeenCalledWith(index, BinaryDataEncoding.HEX);

          expect(generateFileKeyStub).toHaveBeenCalledOnce();
          expect(generateFileKeyStub).toHaveBeenCalledWith(mnemonic, bucketId, bufferizedIndex);

          expect(downloadFileMock).toHaveBeenCalledTimes(1);
          expect(downloadFileMock).toHaveBeenCalledWith(shards, fileSize);

          expect(decryptFileMock).toHaveBeenCalledTimes(1);
          expect(decryptFileMock).toHaveBeenCalledWith(
            crypto.algorithm.type,
            key,
            bufferizedIndex.slice(0, 16),
            fileSize,
          );
        } catch {
          fail('Expected function to not throw an error, but it did.');
        }
      });
    });

    it('Should throw if file version is missing', async () => {
      vi.spyOn(network, 'getDownloadLinks').mockResolvedValue({
        index: '',
        shards: [],
        bucket: '',
        created: new Date(),
        size: 1000,
      });
      try {
        await downloadFile(fakeFileId, fakeBucketId, fakeMnemonic, network, crypto, vi.fn(), vi.fn(), vi.fn());
        expect(false).toBeTruthy();
      } catch (err) {
        expect(err).toBeInstanceOf(FileVersionOneError);
      }
    });

    it('Should throw if file version is 1', async () => {
      vi.spyOn(network, 'getDownloadLinks').mockResolvedValue({
        index: '',
        shards: [],
        bucket: '',
        version: 1,
        created: new Date(),
        size: 1000,
      });
      try {
        await downloadFile(fakeFileId, fakeBucketId, fakeMnemonic, network, crypto, vi.fn(), vi.fn(), vi.fn());
        expect(false).toBeTruthy();
      } catch (err) {
        expect(err).toBeInstanceOf(FileVersionOneError);
      }
    });

    it('Should throw if the mnemonic is invalid', async () => {
      const validateMnemonicStub = vi.spyOn(crypto, 'validateMnemonic').mockReturnValue(false);
      const downloadLinksStub = vi.spyOn(network, 'getDownloadLinks');

      try {
        await downloadFile(fakeFileId, fakeBucketId, fakeMnemonic, network, crypto, vi.fn(), vi.fn(), vi.fn());
        expect(false).toBeTruthy();
      } catch (err) {
        expect(err).toBeInstanceOf(DownloadInvalidMnemonicError);

        expect(validateMnemonicStub).toHaveBeenCalledOnce();
        expect(validateMnemonicStub).toHaveBeenCalledWith(fakeMnemonic);

        expect(downloadLinksStub).not.toHaveBeenCalled();
      }
    });
  });
});
