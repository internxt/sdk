import axios from 'axios';
import sinon from 'sinon';
import { GenerateShareLinkPayload } from '../../src/drive/share/types';
import { validResponse } from '../shared/response';
import { Share } from '../../src/drive';
import { testHeadersWithTokenAndMnemonic } from '../shared/headers';

describe('# share service tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('generate share file link', () => {

    it('Should bubble up the error', async () => {
      // Arrange
      sinon.stub(axios, 'post').rejects(new Error('custom'));
      const { client } = clientAndHeaders();
      const payload: GenerateShareLinkPayload = {
        fileId: '1',
        isFolder: false,
        views: 0,
        encryptionKey: '',
        fileToken: '',
        bucket: ''
      };

      // Act
      const call = client.createShareLink(payload);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(axios, 'post').resolves(validResponse({
        token: 'token'
      }));
      const { client, headers } = clientAndHeaders();
      const payload: GenerateShareLinkPayload = {
        fileId: '1',
        isFolder: false,
        views: 0,
        encryptionKey: '',
        fileToken: '',
        bucket: ''
      };

      // Act
      const body = await client.createShareLink(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/api/storage/share/file/1',
        {
          isFolder: payload.isFolder,
          views: payload.views,
          encryptionKey: payload.encryptionKey,
          fileToken: payload.fileToken,
          bucket: payload.bucket,
        },
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        token: 'token'
      });
    });

  });

  describe('get share token info', () => {

    it('Should bubble up the error', async () => {
      // Arrange
      sinon.stub(axios, 'get').rejects(new Error('custom'));
      const { client } = clientAndHeaders();
      const token = '';

      // Act
      const call = client.getShareByToken(token);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(axios, 'get').resolves(validResponse({
        info: 'some'
      }));
      const { client, headers } = clientAndHeaders();
      const token = 'ma-token';

      // Act
      const body = await client.getShareByToken(token);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/api/storage/share/ma-token',
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        info: 'some'
      });
    });
  });

  describe('get shares list', () => {

    it('Should bubble up the error', async () => {
      // Arrange
      sinon.stub(axios, 'get').rejects(new Error('custom'));
      const { client } = clientAndHeaders();

      // Act
      const call = client.getShareList();

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(axios, 'get').resolves(validResponse({
        list: 'some'
      }));
      const { client, headers } = clientAndHeaders();

      // Act
      const body = await client.getShareList();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/api/share/list',
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        list: 'some'
      });
    });

  });

  function clientAndHeaders(
    apiUrl = '',
    clientName = 'c-name',
    clientVersion = '0.1',
    token = 'my-token',
    mnemonic = 'nemo'
  ): {
    client: Share,
    headers: object
  } {
    const client = new Share(axios, apiUrl, clientName, clientVersion, token, mnemonic);
    const headers = testHeadersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
    return { client, headers };
  }

});