import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Users } from '../../../src/drive';
import { ChangePasswordPayloadNew, UserPublicKeyWithCreationResponse } from '../../../src/drive/users/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';

describe('# users service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('send invitation', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const postStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        sent: true,
      });
      const email = 'my@email.com';

      // Act
      const body = await client.sendInvitation(email);

      // Assert
      expect(postStub).toHaveBeenCalledWith(
        '/user/invite',
        {
          email: email,
        },
        headers,
      );
      expect(body).toEqual({
        sent: true,
      });
    });
  });

  describe('initialize', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        user: {
          root_folder: 1,
        },
      });
      const email = 'e',
        mnemonic = 'm';

      // Act
      const body = await client.initialize(email, mnemonic);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        '/initialize',
        {
          email: email,
          mnemonic: mnemonic,
        },
        headers,
      );
      expect(body).toEqual({
        root_folder: 1,
      });
    });
  });

  describe('refresh', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        user: {},
        token: 't',
      });

      // Act
      const body = await client.refreshUser();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/users/refresh', headers);
      expect(body).toEqual({
        user: {},
        token: 't',
      });
    });
  });

  describe('refresh user avatar', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const mockedAvatarUrl = 'https://example.avatar.com/avatar.jpg';
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        avatar: mockedAvatarUrl,
      });

      // Act
      const body = await client.refreshAvatarUser();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/users/avatar/refresh', headers);
      expect(body).toStrictEqual({
        avatar: mockedAvatarUrl,
      });
    });
  });

  describe('pre register user', () => {
    it('should pre create user', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const email = 'test@test.com';
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        publicKey: 'publicKey',
        keys: {
          kyber: 'publicKeyberKey',
          ecc: 'publicKey',
        },
        user: { uuid: 'exampleUuid', email },
      });

      // Act
      const body = await client.preRegister(email);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/users/pre-create', { email }, headers);
      expect(body).toEqual({
        publicKey: 'publicKey',
        keys: {
          kyber: 'publicKeyberKey',
          ecc: 'publicKey',
        },
        user: { uuid: 'exampleUuid', email },
      });
    });
  });

  describe('change password', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = vi.spyOn(HttpClient.prototype, 'patch').mockResolvedValue({});
      const payload: ChangePasswordPayloadNew = {
        currentEncryptedPassword: '1',
        encryptedMnemonic: '2',
        encryptedPrivateKey: '3',
        keys: {
          encryptedPrivateKey: '3',
          encryptedPrivateKyberKey: '4',
        },
        newEncryptedPassword: '5',
        newEncryptedSalt: '6',
        encryptVersion: '7',
      };

      // Act
      const body = await client.changePassword(payload);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        '/users/password',
        {
          currentPassword: payload.currentEncryptedPassword,
          newPassword: payload.newEncryptedPassword,
          newSalt: payload.newEncryptedSalt,
          mnemonic: payload.encryptedMnemonic,
          privateKey: payload.keys.encryptedPrivateKey,
          privateKyberKey: payload.keys.encryptedPrivateKyberKey,
          encryptVersion: payload.encryptVersion,
        },
        headers,
      );
      expect(body).toEqual({});
    });
  });

  describe('getPublicKeyWithPrecreation', () => {
    it('should call the correct endpoint and return the public key response', async () => {
      const email = 'test@example.com';
      const publicKeyResponse: UserPublicKeyWithCreationResponse = {
        publicKey: 'public_key_example_123',
        publicKyberKey: 'kyber_key_example_123',
      };

      const { client, headers } = clientAndHeaders();
      const putCall = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue(publicKeyResponse);

      const response = await client.getPublicKeyWithPrecreation({ email });

      expect(putCall).toHaveBeenCalledWith(`/users/public-key/${email}`, {}, headers);
      expect(response).toEqual(publicKeyResponse);
    });
  });
});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
  mnemonic = 'nemo',
): {
  client: Users;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Users.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}
