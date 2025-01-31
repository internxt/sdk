import sinon from 'sinon';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { Payments } from '../../../src/drive';
import { CreatePaymentSessionPayload, StripeSessionMode, UserType } from '../../../src/drive/payments/types';
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
        content: 'true',
      });
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.getProducts();

      // Assert
      expect(callStub.firstCall.args).toEqual(['/v3/stripe/products', headers]);
      expect(body).toEqual({
        content: 'true',
      });
    });
  });

  describe('getInvoices', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should call with right params & return data', async () => {
      const callStub = sinon.stub(httpClient, 'get').resolves([
        { id: 'invoice_123', amount: 1000 },
        { id: 'invoice_456', amount: 2000 },
      ]);

      const { client, headers } = clientAndHeadersWithToken();

      const params = {
        subscriptionId: 'sub_789',
        startingAfter: 'invoice_123',
        userType: UserType.Individual,
        limit: 10,
      };

      const invoices = await client.getInvoices(params);

      const expectedQuery = new URLSearchParams({
        subscription: 'sub_789',
        starting_after: 'invoice_123',
        userType: UserType.Individual,
        limit: '10',
      }).toString();

      expect(callStub.firstCall.args).toEqual([`/invoices?${expectedQuery}`, headers]);

      expect(invoices).toEqual([
        { id: 'invoice_123', amount: 1000 },
        { id: 'invoice_456', amount: 2000 },
      ]);
    });

    it('should handle missing optional parameters correctly', async () => {
      const callStub = sinon.stub(httpClient, 'get').resolves([]);

      const { client, headers } = clientAndHeadersWithToken();

      const params = {};

      const expectedQuery = new URLSearchParams({
        userType: UserType.Individual,
      }).toString();

      const invoices = await client.getInvoices(params as any);

      expect(callStub.firstCall.args).toEqual([`/invoices?${expectedQuery}`, headers]);
      expect(invoices).toEqual([]);
    });
  });

  describe('check if product is available', () => {
    it('should call with right params & return data', async () => {
      const callStub = sinon.stub(httpClient, 'get').resolves({
        featuresPerService: {
          antivirus: false,
        },
      });
      const { client, headers } = clientAndHeadersWithToken();

      const body = await client.checkUserAvailableProducts();

      expect(callStub.firstCall.args).toEqual(['/products', headers]);
      expect(body).toEqual({
        featuresPerService: {
          antivirus: false,
        },
      });
    });
  });

  describe('create payment session', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const callStub = sinon.stub(httpClient, 'post').resolves({
        id: 'ident',
      });
      const { client, headers } = clientAndHeadersWithToken();
      const payload: CreatePaymentSessionPayload = {
        canceledUrl: '',
        lifetime_tier: undefined,
        mode: StripeSessionMode.Payment,
        priceId: '',
        successUrl: '',
        test: false,
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
        headers,
      ]);
      expect(body).toEqual({
        id: 'ident',
      });
    });
  });
});

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
): {
  client: Payments;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Payments.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
