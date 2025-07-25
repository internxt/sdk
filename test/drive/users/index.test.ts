import sinon from 'sinon';
import { Users } from '../../../src/drive';
import { ChangePasswordPayloadNew } from '../../../src/drive/users/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('# users service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('send invitation', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const postStub = sinon.stub(httpClient, 'post').resolves({
        sent: true,
      });
      const email = 'my@email.com';

      // Act
      const body = await client.sendInvitation(email);

      // Assert
      expect(postStub.firstCall.args).toEqual([
        '/user/invite',
        {
          email: email,
        },
        headers,
      ]);
      expect(body).toEqual({
        sent: true,
      });
    });
  });

  describe('initialize', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(httpClient, 'post').resolves({
        user: {
          root_folder: 1,
        },
      });
      const email = 'e',
        mnemonic = 'm';

      // Act
      const body = await client.initialize(email, mnemonic);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/initialize',
        {
          email: email,
          mnemonic: mnemonic,
        },
        headers,
      ]);
      expect(body).toEqual({
        root_folder: 1,
      });
    });
  });

  describe('refresh', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(httpClient, 'get').resolves({
        user: {},
        token: 't',
      });

      // Act
      const body = await client.refreshUser();

      // Assert
      expect(callStub.firstCall.args).toEqual(['/user/refresh', headers]);
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
      const callStub = sinon.stub(httpClient, 'get').resolves({
        avatar: mockedAvatarUrl,
      });

      // Act
      const body = await client.refreshAvatarUser();

      // Assert
      expect(callStub.firstCall.args).toStrictEqual(['/user/avatar/refresh', headers]);
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
      const callStub = sinon.stub(httpClient, 'post').resolves({
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
      expect(callStub.firstCall.args).toEqual(['/users/pre-create', { email }, headers]);
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
      const callStub = sinon.stub(httpClient, 'patch').resolves({});
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
      expect(callStub.firstCall.args).toEqual([
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
      ]);
      expect(body).toEqual({});
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
  const headers = headersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
