import sinon from 'sinon';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { testHeadersWithTokenAndMnemonic } from '../../shared/headers';
import { Referrals } from '../../../src/drive';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create();

describe('# users service tests', () => {

  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get referrals', () => {

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(httpClient, 'get').resolves({
        referrals: [1, 2]
      });

      // Act
      const body = await client.getReferrals();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/users-referrals',
        headers
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
  client: Referrals,
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
  const client = Referrals.client(apiUrl, appDetails, apiSecurity);
  const headers = testHeadersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
  return { client, headers };
}
