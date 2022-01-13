import sinon from 'sinon';
import axios from 'axios';
import { validResponse } from '../../shared/response';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { testHeadersWithTokenAndMnemonic } from '../../shared/headers';
import { Referrals } from '../../../src/drive/referrals';

const myAxios = axios.create();

describe('# users service tests', () => {

  beforeEach(() => {
    sinon.stub(axios, 'create').returns(myAxios);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get referrals', () => {

    it('should bubble up and error if request fails', async () => {
      // Arrange
      const { client } = clientAndHeaders();
      sinon.stub(myAxios, 'get').rejects(new Error('custom'));

      // Act
      const call = client.getReferrals();

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = sinon.stub(myAxios, 'get').resolves(validResponse({
        referrals: [1, 2]
      }));

      // Act
      const body = await client.getReferrals();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/users-referrals',
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
