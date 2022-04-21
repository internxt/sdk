import sinon from 'sinon';
import { randomBytes } from 'crypto';

import {
  ALGORITHMS,
  BinaryDataEncoding,
  Crypto,
  DownloadableShard,
  Network
} from '../../src/network';
import { downloadFile, FileVersionOneError } from '../../src/network/download';

const fakeFileId = 'fake-file-id';
const fakeBucketId = 'fake-bucket-id';
const fakeHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const fakeMnemonic = 'test test test test test test test test';
const crypto: Crypto = {
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

describe('network/download', () => {
  describe('downloadFile()', () => {
    it('Should work properly if all is fine', async () => {
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
          url: 'https://fake.com'
        },
        {
          index: 1,
          hash: fakeHash,
          size: 1,
          url: 'https://fake.com'
        }
      ];

      const fileSize = shards.reduce((a, s) => a + s.size, 0);
      const generateFileKeyStub = sinon.stub(crypto, 'generateFileKey').resolves(key);
      const getDownloadLinksStub = sinon.stub(network, 'getDownloadLinks').resolves({
        index,
        shards,
        version: 2,
        bucket: bucketId,
        created: new Date(),
        size: fileSize
      });

      const toBinaryDataMock = jest.fn().mockReturnValue(bufferizedIndex);
      const downloadFileMock = jest.fn();
      const decryptFileMock = jest.fn();

      try {
        await downloadFile(
          fileId,
          bucketId,
          mnemonic,
          network,
          crypto,
          toBinaryDataMock,
          downloadFileMock,
          decryptFileMock
        );

        expect(getDownloadLinksStub.calledOnce).toBeTruthy();
        expect(getDownloadLinksStub.firstCall.args).toStrictEqual([bucketId, fileId]);

        expect(toBinaryDataMock).toBeCalledTimes(2);
        expect(toBinaryDataMock).toHaveBeenCalledWith(index, BinaryDataEncoding.HEX);
        expect(toBinaryDataMock).toHaveBeenCalledWith(index, BinaryDataEncoding.HEX);

        expect(generateFileKeyStub.calledOnce).toBeTruthy();
        expect(generateFileKeyStub.firstCall.args).toStrictEqual([mnemonic, bucketId, bufferizedIndex]);

        expect(downloadFileMock).toBeCalledTimes(1);
        expect(downloadFileMock).toHaveBeenCalledWith(shards, fileSize);

        expect(decryptFileMock).toBeCalledTimes(1);
        expect(decryptFileMock).toHaveBeenCalledWith(
          crypto.algorithm.type,
          key,
          bufferizedIndex.slice(0, 16),
          fileSize
        );
      } catch (err) {
        expect(true).toBeFalsy();
      }
    });

    it('Should throw if file version is missing', async () => {
      sinon.stub(network, 'getDownloadLinks').resolves({
        index: '',
        shards: [],
        bucket: '',
        created: new Date(),
        size: 1000
      });
      try {
        await downloadFile(
          fakeFileId,
          fakeBucketId,
          fakeMnemonic,
          network,
          crypto,
          jest.fn(),
          jest.fn(),
          jest.fn()
        );
        expect(false).toBeTruthy();
      } catch (err) {
        expect(err).toBeInstanceOf(FileVersionOneError);
      }
    });

    it('Should throw if file version is 1', async () => {
      sinon.stub(network, 'getDownloadLinks').resolves({
        index: '',
        shards: [],
        bucket: '',
        version: 1,
        created: new Date(),
        size: 1000
      });
      try {
        await downloadFile(
          fakeFileId,
          fakeBucketId,
          fakeMnemonic,
          network,
          crypto,
          jest.fn(),
          jest.fn(),
          jest.fn()
        );
        expect(false).toBeTruthy();
      } catch (err) {
        expect(err).toBeInstanceOf(FileVersionOneError);
      }
    });
  });
});
