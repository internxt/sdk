import sinon from 'sinon';
import {
  GenerateShareFileLinkPayload,
  GenerateShareFolderLinkPayload,
  SharedDirectoryFolders, GetSharedDirectoryFoldersPayload, GetSharedDirectoryFilesPayload
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

  describe('generate share file link', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        token: 'token'
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareFileLinkPayload = {
        fileId: '1',
        views: 0,
        encryptionKey: '',
        fileToken: '',
        bucket: ''
      };

      // Act
      const body = await client.createShareFileLink(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/file/1',
        {
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

  describe('generate share folder link', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        token: 'token',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareFolderLinkPayload = {
        folderId: 1,
        views: 0,
        bucketToken: '',
        bucket: '',
        encryptedMnemonic: 'lola'
      };

      // Act
      const body = await client.createShareFolderLink(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/share/folder/1',
        {
          views: payload.views,
          bucketToken: payload.bucketToken,
          bucket: payload.bucket,
          mnemonic: payload.encryptedMnemonic,
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
      const body = await client.getSharedFileByToken(token);

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

  describe('get shared folder info', () => {

    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        info: 'some'
      });
      const { client, headers } = clientAndHeaders();
      const token = 'ma-token';

      // Act
      const body = await client.getSharedFolderByToken(token);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/storage/shared-folder/ma-token',
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
      const payload: GetSharedDirectoryFoldersPayload = {
        token: 'tokk',
        directoryId: 1,
        offset: 0,
        limit: 10
      };

      // Act
      const body = await client.getSharedDirectoryFolders(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/storage/share/down/folders?token=${payload.token}&directoryId=${payload.directoryId}&offset=${payload.offset}&limit=${payload.limit}`,
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
      const payload: GetSharedDirectoryFilesPayload = {
        token: 'tokk',
        directoryId: 1,
        offset: 0,
        limit: 10,
        code: 'code'
      };

      // Act
      const body = await client.getSharedDirectoryFiles(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/storage/share/down/files?code=${payload.code}&token=${payload.token}&directoryId=${payload.directoryId}&offset=${payload.offset}&limit=${payload.limit}`,
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