import sinon from 'sinon';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { testHeadersWithToken } from '../../shared/headers';
import { Payments } from '../../../src/drive';
import { CreatePaymentSessionPayload, StripeSessionMode } from '../../../src/drive/payments/types';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('payments service', () => {

  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get products', () => {

    it('should call with right params & return data', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'get').resolves({
        content: 'true'
      });
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getProducts();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/v3/stripe/products',
        headers
      ]);
      expect(body).toEqual({
        content: 'true'
      });
    });

  });

  describe('create payment session', () => {

    it('should call with right params & return data', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        id: 'ident'
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: CreatePaymentSessionPayload = {
        canceledUrl: '',
        lifetime_tier: undefined,
        mode: StripeSessionMode.Payment,
        priceId: '',
        successUrl: '',
        test: false
      };

      // Act
      const body = await client.createSession(payload);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/v2/stripe/session',
        {
          test: payload.test,
          lifetime_tier: payload.lifetime_tier,
          mode: payload.mode,
          priceId: payload.priceId,
          successUrl: payload.successUrl,
          canceledUrl: payload.canceledUrl,
        },
        headers
      ]);
      expect(body).toEqual({
        id: 'ident'
      });
    });

  });

});


function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token'
): {
  client: Payments,
  headers: object
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
    mnemonic: '',
  };
  const client = Payments.client(apiUrl, appDetails, apiSecurity);
  const headers = testHeadersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
