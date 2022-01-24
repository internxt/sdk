import sinon from 'sinon';
import { GenerateShareLinkPayload } from '../../../src/drive/share/types';
import { Share } from '../../../src/drive';
import { testHeadersWithTokenAndMnemonic } from '../../shared/headers';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('# share service tests', () => {

  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('generate share file link', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        token: 'token'
      });
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
        '/storage/share/file/1',
        {
          isFolder: payload.isFolder,
          views: payload.views,
          encryptionKey: payload.encryptionKey,
          fileToken: payload.fileToken,
          bucket: payload.bucket,
        },
        headers
      ]);
      expect(body).toEqual({
        token: 'token'
      });
    });

  });

  describe('get share token info', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        info: 'some'
      });
      const { client, headers } = clientAndHeaders();
      const token = 'ma-token';

      // Act
      const body = await client.getShareByToken(token);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/ma-token',
        headers
      ]);
      expect(body).toEqual({
        info: 'some'
      });
    });
  });

  describe('get shares list', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        list: 'some'
      });
      const { client, headers } = clientAndHeaders();

      // Act
      const body = await client.getShareList();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/share/list',
        headers
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
    const appDetails: AppDetails = {
      clientName: clientName,
      clientVersion: clientVersion,
    };
    const apiSecurity: ApiSecurity = {
      token: token,
      mnemonic: mnemonic,
    };
    const client = Share.client(apiUrl, appDetails, apiSecurity);
    const headers = testHeadersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
    return { client, headers };
  }

});