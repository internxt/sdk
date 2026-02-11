import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GenerateShareLinkPayload,
  GetSharedDirectoryPayload,
  SharedFiles,
  SharingInfo,
  SharingMeta,
} from '../../../src/drive/share/types';
import { Share } from '../../../src/drive';
import { basicHeaders, headersWithToken } from '../../../src/shared/headers';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { HttpClient } from '../../../src/shared/http/client';
import { fail } from 'assert';

describe('# share service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate share link', () => {
    it('Should be called with fail argments & throws Error', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        token: 'token',
      });
      const { client } = clientAndHeadersWithToken();
      const payload: GenerateShareLinkPayload = {
        itemId: '1',
        type: 'files',
        timesValid: 0,
        encryptedMnemonic: '',
        encryptedCode: '',
        itemToken: '',
        bucket: '',
      };

      // Assert
      try {
        await client.createShareLink(payload);
        fail('Expected function to throw an error, but it did not.');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid type');
      }
    });

    it('Should be called with right arguments & return content of file', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        token: 'token',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareLinkPayload = {
        itemId: '1',
        type: 'file',
        timesValid: 0,
        itemToken: '',
        bucket: '',
        encryptedCode: '',
        encryptedMnemonic: '',
      };

      // Act
      const body = await client.createShareLink(payload);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        '/storage/share/file/1',
        {
          timesValid: payload.timesValid,
          encryptedMnemonic: payload.encryptedMnemonic,
          itemToken: payload.itemToken,
          bucket: payload.bucket,
          encryptedCode: payload.encryptedCode,
        },
        headers,
      );
      expect(body).toEqual({
        token: 'token',
      });
    });

    it('Should be called with right arguments & return content of folders', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        token: 'token',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: GenerateShareLinkPayload = {
        timesValid: 0,
        itemToken: '',
        bucket: '',
        encryptedMnemonic: 'lola',
        itemId: '1',
        type: 'folder',
        encryptedCode: '',
      };

      // Act
      const body = await client.createShareLink(payload);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        '/storage/share/folder/1',
        {
          timesValid: payload.timesValid,
          encryptedMnemonic: payload.encryptedMnemonic,
          itemToken: payload.itemToken,
          bucket: payload.bucket,
          encryptedCode: payload.encryptedCode,
        },
        headers,
      );
      expect(body).toEqual({
        token: 'token',
      });
    });
  });

  describe('get share token info', () => {
    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        info: 'some',
      });
      const { client, headers } = clientAndBasicHeaders();
      const token = 'ma-token';

      // Act
      const body = await client.getShareLink(token);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/storage/share/ma-token', headers);
      expect(body).toEqual({
        info: 'some',
      });
    });
  });

  describe('delete share by id', () => {
    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({
        deleted: true,
        shareId: '1',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const shareId = '1';

      // Act
      const body = await client.deleteShareLink(shareId);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/storage/share/1', headers);
      expect(body).toEqual({
        deleted: true,
        shareId: '1',
      });
    });
  });

  describe('Validate Invitation', () => {
    it('Valid invitation', async () => {
      // Arrange
      const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        uuid: mockUuid,
      });
      const { client, headers } = clientAndHeadersWithToken();
      const shareId = mockUuid;

      // Act
      const body = await client.validateInviteExpiration(shareId);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`sharings/invites/${mockUuid}/validate`, headers);
      expect(body).toEqual({
        uuid: mockUuid,
      });
    });
  });

  describe('Add password to public sharing', () => {
    it('Add password', async () => {
      // Arrange
      const mockUuid = '550e8400-e29b-41d4-a716-446655440000';
      const sharedFile: SharingMeta = {
        id: '1',
        itemId: 'file123',
        itemType: 'file',
        ownerId: 'user123',
        sharedWith: 'user456',
        encryptionKey: 'sampleEncryptionKey',
        encryptedCode: 'sampleEncryptedCode',
        encryptedPassword: 'sampleEncryptedPassword',
        encryptionAlgorithm: 'AES-256',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'private',
        item: {} as SharedFiles,
        itemToken: 'sampleItemToken',
      };

      const callStub = vi.spyOn(HttpClient.prototype, 'patch').mockResolvedValue(sharedFile);
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.saveSharingPassword(mockUuid, 'encryptedPassword');

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `sharings/${mockUuid}/password`,
        { encryptedPassword: 'encryptedPassword' },
        headers,
      );
      expect(body).toEqual(sharedFile);
    });
  });

  describe('Remove password', () => {
    it('Password removed', async () => {
      // Arrange
      const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

      const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({});
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      await client.removeSharingPassword(mockUuid);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`sharings/${mockUuid}/password`, headers);
    });
  });

  describe('get public shared item info', () => {
    it('Should be called with sharingId and return basic info', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        plainName: 'anyname',
        size: 30,
        type: 'pdf',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const body = await client.getPublicSharedItemInfo(mockUuid);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`sharings/public/${mockUuid}/item`, headers);
      expect(body).toEqual({
        plainName: 'anyname',
        size: 30,
        type: 'pdf',
      });
    });
  });

  describe('get shares list', () => {
    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        list: 'some',
      });
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getShareLinks();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/storage/share/list?page=0&perPage=50', headers);
      expect(body).toEqual({
        list: 'some',
      });
    });

    it('Should be called with right pagination & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        list: 'some',
      });
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getShareLinks(2, 100);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/storage/share/list?page=2&perPage=100', headers);
      expect(body).toEqual({
        list: 'some',
      });
    });
  });

  describe('get shared folder info', () => {
    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        info: 'some',
      });
      const { client, headers } = clientAndBasicHeaders();
      const token = 'ma-token';

      // Act
      const body = await client.getShareLink(token);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/storage/share/ma-token', headers);
      expect(body).toEqual({
        info: 'some',
      });
    });
  });

  describe('get shared-directory folders', () => {
    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        info: 'some',
      });
      const { client, headers } = clientAndBasicHeaders();
      const payload: GetSharedDirectoryPayload = {
        token: 'tokk',
        folderId: 1,
        parentId: 1,
        page: 1,
        perPage: 10,
        type: 'folder',
      };

      // Act
      const body = await client.getShareLinkDirectory(payload);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `/storage/share/down/folders?token=${payload.token}&folderId=${payload.folderId}&parentId=${payload.parentId}&page=${payload.page}&perPage=${payload.perPage}`,
        headers,
      );
      expect(body).toEqual({
        info: 'some',
      });
    });
  });

  describe('get shared-directory files', () => {
    it('Should be called with right arguments & return content', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        info: 'some',
      });
      const { client, headers } = clientAndBasicHeaders();
      const payload: GetSharedDirectoryPayload = {
        token: 'tokk',
        type: 'file',
        folderId: 1,
        parentId: 1,
        page: 0,
        perPage: 10,
        code: 'code',
      };

      // Act
      const body = await client.getShareLinkDirectory(payload);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `/storage/share/down/files?token=${payload.token}&folderId=${payload.folderId}&parentId=${payload.parentId}&page=${payload.page}&perPage=${payload.perPage}&code=${payload.code}`,
        headers,
      );
      expect(body).toEqual({
        info: 'some',
      });
    });
  });

  describe('get shared folder size', () => {
    it('Should be called with right arguments & return folder size', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        size: 30,
      });
      const { client, headers } = clientAndHeadersWithToken();
      const mockUuid = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const body = await client.getSharedFolderSize(mockUuid);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`sharings/public/${mockUuid}/folder/size`, headers);
      expect(body).toEqual({
        size: 30,
      });
    });
  });

  describe('Get sharing info', () => {
    it('When the sharing info is requested, then the right data should be returned', async () => {
      const mockedResponse: SharingInfo = {
        invitationsCount: 0,
        publicSharing: {
          encryptedCode: 'encrypted-code',
          id: 'sharing-id',
          isPasswordProtected: false,
        },
        type: 'public',
      };
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(mockedResponse);
      const { client, headers } = clientAndHeadersWithToken();
      const mockId = 'item-id';
      const mockedItemType = 'item-type';

      // Act
      const body = await client.getSharingInfo({ itemId: mockId, itemType: mockedItemType });

      // Assert
      expect(callStub).toHaveBeenCalledWith(`sharings/${mockedItemType}/${mockId}/info`, headers);
      expect(body).toStrictEqual(mockedResponse);
    });
  });

  function clientAndHeadersWithToken(
    apiUrl = '',
    clientName = 'c-name',
    clientVersion = '0.1',
    token = 'my-token',
  ): {
    client: Share;
    headers: object;
  } {
    const appDetails: AppDetails = {
      clientName: clientName,
      clientVersion: clientVersion,
    };
    const apiSecurity: ApiSecurity = {
      token: token,
    };
    const client = Share.client(apiUrl, appDetails, apiSecurity);
    const headers = headersWithToken({ clientName, clientVersion, token });
    return { client, headers };
  }

  function clientAndBasicHeaders(
    apiUrl = '',
    clientName = 'c-name',
    clientVersion = '0.1',
  ): {
    client: Share;
    headers: object;
  } {
    const appDetails: AppDetails = {
      clientName: clientName,
      clientVersion: clientVersion,
    };
    const apiSecurity: ApiSecurity = {
      token: '',
    };
    const client = Share.client(apiUrl, appDetails, apiSecurity);
    const headers = basicHeaders({ clientName, clientVersion });
    return { client, headers };
  }
});
