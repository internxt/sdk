import sinon from 'sinon';
import { Users } from '../../../src/drive';
import axios from 'axios';
import { testHeadersWithTokenAndMnemonic } from '../../shared/headers';
import { validResponse } from '../../shared/response';
import { ChangePasswordPayload } from '../../../src/drive/users/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';

const myAxios = axios.create();

describe('# users service tests', () => {

  beforeEach(() => {
    sinon.stub(axios, 'create').returns(myAxios);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('send invitation', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(myAxios, 'post').rejects(new Error('custom'));
      const email = 'my@email.com';

      // Act
      const call = client.sendInvitation(email);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const postStub = sinon.stub(myAxios, 'post').resolves(validResponse({
        sent: true
      }));
      const email = 'my@email.com';

      // Act
      const body = await client.sendInvitation(email);

      // Assert
      expect(postStub.firstCall.args).toEqual([
        '/user/invite',
        {
          email: email
        },
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        sent: true
      });
    });

  });

  describe('initialize', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(myAxios, 'post').rejects(new Error('custom'));
      const email = '', mnemonic = '';

      // Act
      const call = client.initialize(email, mnemonic);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(myAxios, 'post').resolves(validResponse({
        user: {
          root_folder: 1
        }
      }));
      const email = 'e', mnemonic = 'm';

      // Act
      const body = await client.initialize(email, mnemonic);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/initialize',
        {
          email: email,
          mnemonic: mnemonic
        },
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        root_folder: 1
      });
    });

  });

  describe('refresh', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(myAxios, 'get').rejects(new Error('custom'));

      // Act
      const call = client.refreshUser();

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(myAxios, 'get').resolves(validResponse({
        user: {},
        token: 't',
      }));

      // Act
      const body = await client.refreshUser();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/user/refresh',
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        user: {},
        token: 't',
      });
    });

  });

  describe('change password', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(myAxios, 'patch').rejects(new Error('custom'));
      const payload: ChangePasswordPayload = {
        currentEncryptedPassword: '1',
        encryptedMnemonic: '2',
        encryptedPrivateKey: '3',
        newEncryptedPassword: '4',
        newEncryptedSalt: '5'
      };

      // Act
      const call = client.changePassword(payload);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(myAxios, 'patch').resolves(validResponse({}));
      const payload: ChangePasswordPayload = {
        currentEncryptedPassword: '1',
        encryptedMnemonic: '2',
        encryptedPrivateKey: '3',
        newEncryptedPassword: '4',
        newEncryptedSalt: '5'
      };

      // Act
      const body = await client.changePassword(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/user/password',
        {
          currentPassword: payload.currentEncryptedPassword,
          newPassword: payload.newEncryptedPassword,
          newSalt: payload.newEncryptedSalt,
          mnemonic: payload.encryptedMnemonic,
          privateKey: payload.encryptedPrivateKey,
        },
        {
          headers: headers
        }
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
  mnemonic = 'nemo'
): {
  client: Users,
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
  const client = Users.client(apiUrl, appDetails, apiSecurity);
  const headers = testHeadersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
  return { client, headers };
}
