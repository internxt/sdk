import sinon from 'sinon';
import { Users } from '.';
import { headersWithToken } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { UserPublicKeyWithCreationResponse } from './types';

const httpClient = HttpClient.create('');

describe('Users service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Users methods', () => {
    describe('getPublicKeyWithPrecreation', () => {
      it('should call the correct endpoint and return the public key response', async () => {
        const email = 'test@example.com';
        const publicKeyResponse: UserPublicKeyWithCreationResponse = {
          publicKey: 'public_key_example_123',
          publicKyberKey: 'kyber_key_example_123',
        };

        const { client, headers } = clientAndHeaders();
        const putCall = sinon.stub(httpClient, 'put').resolves(publicKeyResponse);

        const response = await client.getPublicKeyWithPrecreation({ email });

        expect(putCall.firstCall.args).toEqual([`/users/public-key/${email}`, {}, headers]);
        expect(response).toEqual(publicKeyResponse);
      });
    });
  });
});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
): {
  client: Users;
  headers: object;
} {
  const appDetails = {
    clientName,
    clientVersion,
  };
  const apiSecurity = {
    token,
    unauthorizedCallback: () => {},
  };
  const client = Users.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
