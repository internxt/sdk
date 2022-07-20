import sinon from 'sinon';
import { GenerateShareLinkPayload, GetSharedDirectoryPayload
} from '../../../src/drive/share/types';
import { Share } from '../../../src/drive';
import { basicHeaders, headersWithTokenAndMnemonic } from '../../../src/shared/headers';
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

  describe('generate share link', () => {


    it('Should be called with fail argments & throws Error', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        token: 'token'
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareLinkPayload = {
        itemId: '1',
        type: 'files',
        timesValid: 0,
        encryptionKey: '',
        itemToken: '',
        bucket: '',
        mnemonic: ''
      };

      // Assert
      expect(() => {
        client.createShareLink(payload);
      }).toThrowError('Invalid type');
    });

    it('Should be called with right arguments & return content of file', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        token: 'token'
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareLinkPayload = {
        itemId: '1',
        type: 'file',
        timesValid: 0,
        encryptionKey: '',
        itemToken: '',
        bucket: '',
        mnemonic: ''
      };

      // Act
      const body = await client.createShareLink(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/file/1',
        {
          timesValid: payload.timesValid,
          encryptionKey: payload.encryptionKey,
          mnemonic: payload.mnemonic,
          itemToken: payload.itemToken,
          bucket: payload.bucket,
        },
        headers
      ]);
      expect(body).toEqual({
        token: 'token'
      });
    });

    it('Should be called with right arguments & return content of folders', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        token: 'token',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareLinkPayload = {
        timesValid: 0,
        itemToken: '',
        bucket: '',
        mnemonic: 'lola',
        itemId: '1',
        type: 'folder'
      };

      // Act
      const body = await client.createShareLink(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/folder/1',
        {
          timesValid: payload.timesValid,
          encryptionKey: payload.encryptionKey,
          mnemonic: payload.mnemonic,
          itemToken: payload.itemToken,
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
      const body = await client.getShareLink(token);

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
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getShareLinks();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/list?page=1&perPage=50',
        headers
      ]);
      expect(body).toEqual({
        list: 'some'
      });
    });

    it('Should be called with right pagination & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        list: 'some'
      });
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getShareLinks(2, 100);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/list?page=2&perPage=100',
        headers
      ]);
      expect(body).toEqual({
        list: 'some'
      });
    });

  });

  describe('get shared folder info', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        info: 'some'
      });
      const { client, headers } = clientAndHeaders();
      const token = 'ma-token';

      // Act
      const body = await client.getShareLink(token);

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

  describe('get shared-directory folders', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        info: 'some'
      });
      const { client, headers } = clientAndHeaders();
      const payload: GetSharedDirectoryPayload = {
        token: 'tokk',
        folderId: 1,
        page: 1,
        perPage: 10,
        type: 'folder'
      };

      // Act
      const body = await client.getShareLinkDirectory(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/storage/share/down/folders?token=${payload.token}&folderId=${payload.folderId}&page=${payload.page}&perPage=${payload.perPage}`,
        headers
      ]);
      expect(body).toEqual({
        info: 'some'
      });
    });

  });

  describe('get shared-directory files', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        info: 'some'
      });
      const { client, headers } = clientAndHeaders();
      const payload: GetSharedDirectoryPayload = {
        token: 'tokk',
        type: 'file',
        folderId: 1,
        page: 0,
        perPage: 10,
        code: 'code'
      };

      // Act
      const body = await client.getShareLinkDirectory(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/storage/share/down/files?token=${payload.token}&folderId=${payload.folderId}&page=${payload.page}&perPage=${payload.perPage}&code=${payload.code}`,
        headers
      ]);
      expect(body).toEqual({
        info: 'some'
      });
    });

  });

  function clientAndHeadersWithToken(
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
    const headers = headersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
    return { client, headers };
  }

  function clientAndHeaders(
    apiUrl = '',
    clientName = 'c-name',
    clientVersion = '0.1',
  ): {
    client: Share,
    headers: object
  } {
    const appDetails: AppDetails = {
      clientName: clientName,
      clientVersion: clientVersion,
    };
    const apiSecurity: ApiSecurity = {
      token: '',
      mnemonic: '',
    };
    const client = Share.client(apiUrl, appDetails, apiSecurity);
    const headers = basicHeaders(clientName, clientVersion);
    return { client, headers };
  }

});