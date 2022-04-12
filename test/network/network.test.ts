import { HttpClient } from '../../src/shared/http/client';
import sinon from 'sinon';
import { AppDetails } from '../../src/shared';
import { Network } from '../../src/network/index';
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

describe('network ', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('validate inputs', () => {
    it('Validates startUpload', async () => {
      // Arrange
      const { client } = clientAndHeadersWithBasicAuth();
      const idBucket = 'id-bucket';
      const invalidIndexPayload: StartUploadPayload = {
        uploads: [{ index: 'invalid-hex', size: 40 }],
      };

      // Act
      try {
        const promise = await client.startUpload(idBucket, invalidIndexPayload);
        expect(promise).toBeUndefined();
      } catch (err) {
        // Assert
        expect(err).toEqual(new Error('Invalid index'));
      }

      // Arrange
      const invalidSizePayload: StartUploadPayload = {
        uploads: [{ index: validHex, size: -33 }],
      };

      // Act
      try {
        const promise = await client.startUpload(idBucket, invalidSizePayload);
        expect(promise).toBeUndefined();
      } catch (err) {
        // Assert
        expect(err).toEqual(new Error('Invalid size'));
      }
    });
  });

  it('Validates finishUpload', async () => {
    // Arrange
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

    // Act
    try {
      const promise = await client.finishUpload(idBucket, invalidIndexPayload);
      expect(promise).toBeUndefined();
    } catch (err) {
      // Assert
      expect(err).toEqual(new Error('Invalid index'));
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
        uploads: [{ index: validHex, size: 40 }],
      };
      const resolvesTo: StartUploadResponse = {
        uploads: [{ index: validHex, uuid: validUUID, url: '' }],
      };
      const callStub = sinon.stub(httpClient, 'post').resolves(resolvesTo);
      const staticStartUpload = jest.spyOn(Network.prototype as any, 'startUpload');

      // Act
      const response = await client.startUpload(idBucket, validStartUploadPayload);

      // Assert
      expect(response).toEqual(resolvesTo);
      expect(staticStartUpload).toHaveBeenCalled();
      expect(callStub.firstCall.args).toEqual([
        `/v2/buckets/${idBucket}/files/start`,
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
        index: validHex,
        frame: 'frame',
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
      expect(callStub.firstCall.args).toEqual([`/v2/buckets/${idBucket}/files/${file}/mirrors`, headers]);
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
): {
  client: Network;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const client = Network.client(apiUrl, appDetails, auth);
  const headers = headersWithBasicAuth(clientName, clientVersion, {
    username: auth.bridgeUser,
    password: auth.userId,
  });
  return { client, headers };
}
