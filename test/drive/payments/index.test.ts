import sinon from 'sinon';
import axios from 'axios';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { testHeadersWithToken } from '../../shared/headers';
import { Payments } from '../../../src/drive';
import { validResponse } from '../../shared/response';
import { CreatePaymentSessionPayload, StripeSessionMode } from '../../../src/drive/payments/types';

const myAxios = axios.create();

describe('payments service', () => {

  beforeEach(() => {
    sinon.stub(axios, 'create').returns(myAxios);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get products', () => {

    it('should bubble up an error if request fails', async () => {
      // Arrange
      sinon.stub(myAxios, 'get').rejects(new Error('custom'));
      const { client } = clientAndHeadersWithToken();

      // Act
      const call = client.getProducts();

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return data', async () => {
      // Arrange
      const callStub = sinon.stub(myAxios, 'get').resolves(validResponse({
        content: 'true'
      }));
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getProducts();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/v3/stripe/products',
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        content: 'true'
      });
    });

  });

  describe('create payment session', () => {

    it('should bubble up an error if request fails', async () => {
      // Arrange
      sinon.stub(myAxios, 'post').rejects(new Error('custom'));
      const { client } = clientAndHeadersWithToken();
      const payload: CreatePaymentSessionPayload = {
        canceledUrl: '',
        lifetime_tier: undefined,
        mode: StripeSessionMode.Payment,
        priceId: '',
        successUrl: '',
        test: false
      };

      // Act
      const call = client.createSession(payload);

      // Assert
      await expect(call).rejects.toThrowError('custom');
    });

    it('should call with right params & return data', async () => {
      // Arrange
      const callStub = sinon.stub(myAxios, 'post').resolves(validResponse({
        id: 'ident'
      }));
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
        {
          headers: headers
        }
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
