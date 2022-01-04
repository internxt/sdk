import sinon from 'sinon';
import { Users } from '../../../src/drive';
import { ApiSecureConnectionDetails } from '../../../src/shared';
import axios from 'axios';
import { testHeadersWithTokenAndMnemonic } from '../../shared/headers';
import { validResponse } from '../../shared/response';

describe('# users service tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('send invitation', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(axios, 'post').rejects(new Error('custom'));
      const email = 'my@email.com';

      // Act
      const call = client.sendInvitation(email);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const postStub = sinon.stub(axios, 'post').resolves(validResponse({
        sent: true
      }));
      const email = 'my@email.com';

      // Act
      const body = await client.sendInvitation(email);

      // Assert
      expect(postStub.firstCall.args).toEqual([
        '/api/user/invite',
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

  describe('get referrals', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(axios, 'get').rejects(new Error('custom'));

      // Act
      const call = client.getReferrals();

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(axios, 'get').resolves(validResponse({
        referrals: [1, 2]
      }));

      // Act
      const body = await client.getReferrals();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/api/users-referrals',
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        referrals: [1, 2]
      });
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
  const apiDetails: ApiSecureConnectionDetails = {
    url: apiUrl,
    clientName: clientName,
    clientVersion: clientVersion,
    mnemonic: mnemonic,
    token: token,
  };
  const client = new Users(axios, apiDetails);
  const headers = testHeadersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
  return { client, headers };
}
