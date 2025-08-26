import sinon from 'sinon';

import { HttpClient } from '../../src/shared/http/client';
import { AppDetails } from '../../src/shared';
import {
  DuplicatedIndexesError,
  InvalidFileIndexError,
  InvalidUploadIndexError,
  InvalidUploadSizeError,
  Network,
} from '../../src/network/index';
import { headersWithBasicAuth } from '../../src/shared/headers/index';
import {
  StartUploadPayload,
  FinishUploadPayload,
  FinishUploadResponse,
  StartUploadResponse,
} from '../../src/network/types';

const httpClient = HttpClient.create('');

const validUUID = 'b541b138-a6f2-4729-8d20-8e6011cb8216';
const validHex = '2e1884c34f174110ca6e324e7b745754b3d6356b53ef9f594b960fd534050089';

const url = 'http://internxt.com';

const invalidIndex = -1;
const validIndex = 0;

const invalidSize = -33;
const validSize = 1;

describe('network ', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('startUpload()', () => {
    it('Should throw if an invalid size is provided', async () => {
      const { client } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';

      try {
        await client.startUpload(idBucket, {
          uploads: [{ index: validIndex, size: invalidSize }],
        });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidUploadSizeError);
      }
    });

    it('Should throw if an invalid index is provided', async () => {
      const { client } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';

      try {
        await client.startUpload(idBucket, {
          uploads: [{ index: invalidIndex, size: validSize }],
        });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidUploadIndexError);
      }
    });

    it('Should throw if an index is duplicated', async () => {
      const { client } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';

      try {
        await client.startUpload(idBucket, {
          uploads: [
            { index: validIndex, size: validSize },
            { index: validIndex, size: validSize },
          ],
        });
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBeInstanceOf(DuplicatedIndexesError);
      }
    });

    it('Should work properly if the input is valid', async () => {
      const { client } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';
      const uploads = [
        { index: validIndex, size: validSize },
        { index: validIndex + 1, size: validSize },
      ];

      const expected = {
        uploads: uploads.map((u) => ({
          index: u.index,
          uuid: validUUID,
          url,
          urls: null,
        })),
      };

      sinon.stub(Network, 'startUpload').resolves(expected);

      const received = await client.startUpload(idBucket, { uploads });

      expect(received).toStrictEqual(expected);
    });
  });

  it('Validates finishUpload', async () => {
    const { client } = clientAndHeadersWithBasicAuth();

    const idBucket = 'id-bucket';
    const invalidIndexPayload: FinishUploadPayload = {
      index: 'invalid-hex',
      shards: [
        {
          uuid: validUUID,
          hash: 'a-hash',
        },
      ],
    };

    try {
      const promise = await client.finishUpload(idBucket, invalidIndexPayload);
      expect(promise).toBeUndefined();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidFileIndexError);
    }

    // Arrange
    const invalidUUIDPayload: FinishUploadPayload = {
      index: validHex,
      shards: [
        {
          uuid: 'invalid-uuid',
          hash: 'a-hash',
        },
      ],
    };

    // Act
    try {
      const promise = await client.finishUpload(idBucket, invalidUUIDPayload);
      expect(promise).toBeUndefined();
    } catch (err) {
      // Assert
      expect(err).toEqual(new Error('Invalid UUID'));
    }
  });

  describe('Calls static methods', () => {
    it('should call static startUpload with correct parameters', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';
      const validStartUploadPayload: StartUploadPayload = {
        uploads: [{ index: 0, size: 40 }],
      };
      const resolvesTo: StartUploadResponse = {
        uploads: [{ index: validIndex, uuid: validUUID, url: '', urls: null }],
      };
      const callStub = sinon.stub(httpClient, 'post').resolves(resolvesTo);
      const staticStartUpload = jest.spyOn(Network.prototype as any, 'startUpload');

      // Act
      const response = await client.startUpload(idBucket, validStartUploadPayload);

      // Assert
      expect(response).toEqual(resolvesTo);
      expect(staticStartUpload).toHaveBeenCalled();
      expect(callStub.firstCall.args).toEqual([
        `/v2/buckets/${idBucket}/files/start?multiparts=1`,
        validStartUploadPayload,
        headers,
      ]);
    });

    it('should call static finishUpload with correct parameters', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';
      const validFinishUploadPayload: FinishUploadPayload = {
        index: validHex,
        shards: [
          {
            uuid: validUUID,
            hash: 'a-hash',
          },
        ],
      };
      const resolvesTo: FinishUploadResponse = {
        id: 'file-id',
        index: validHex,
        bucket: idBucket,
        name: 'name',
        mimetype: 'mimetype',
        created: new Date(),
      };

      const callStub = sinon.stub(httpClient, 'post').resolves(resolvesTo);

      const staticFinishUpload = jest.spyOn(Network.prototype as any, 'finishUpload');

      // Act
      const response = await client.finishUpload(idBucket, validFinishUploadPayload);

      // Assert
      expect(response).toEqual(resolvesTo);
      expect(staticFinishUpload).toHaveBeenCalled();
      expect(callStub.firstCall.args).toEqual([
        `/v2/buckets/${idBucket}/files/finish`,
        validFinishUploadPayload,
        headers,
      ]);
    });

    it('should call static getDownloadLinks with correct parameters', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';
      const file = 'a-file';
      const resolvesTo = {
        bucket: 'id-bucket',
        index: validHex,
        created: new Date(),
        shards: [{ index: validHex, size: 33, hash: 'a-hash', url: 'a-url' }],
      };
      const callStub = sinon.stub(httpClient, 'get').resolves(resolvesTo);

      const staticGetDownloadLinks = jest.spyOn(Network.prototype as any, 'getDownloadLinks');

      // Act
      const links = await client.getDownloadLinks(idBucket, file);

      // Assert
      expect(links).toEqual(resolvesTo);
      expect(staticGetDownloadLinks).toHaveBeenCalled();
      expect(callStub.firstCall.args).toEqual([
        `/buckets/${idBucket}/files/${file}/info`,
        { ...headers, 'x-api-version': '2' },
      ]);
    });

    it('should call static deleteFile with correct parameters', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';
      const file = 'a-file';
      const callStub = sinon.stub(httpClient, 'delete').resolves();

      const staticGetDownloadLinks = jest.spyOn(Network.prototype as any, 'deleteFile');

      // Act
      await client.deleteFile(idBucket, file);

      // Assert
      expect(staticGetDownloadLinks).toHaveBeenCalled();
      expect(callStub.firstCall.args).toEqual([`/v2/buckets/${idBucket}/files/${file}`, headers]);
    });
  });
});

function clientAndHeadersWithBasicAuth(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  auth = {
    bridgeUser: 'user',
    userId: 'password',
  },
  desktopHeader = 'desktop-header',
): {
  client: Network;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
    desktopHeader,
  };
  const client = Network.client(apiUrl, appDetails, auth);
  const headers = headersWithBasicAuth({
    clientName,
    clientVersion,
    auth: {
      username: auth.bridgeUser,
      password: auth.userId,
    },
    desktopToken: desktopHeader,
  });
  return { client, headers };
}
