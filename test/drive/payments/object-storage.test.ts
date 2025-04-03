import sinon from 'sinon';
import { AppDetails } from '../../../src/shared';
import { basicHeaders } from '../../../src/shared/headers';
import { ObjectStorage } from '../../../src/drive';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('Object Storage service', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Get object storage plan by id', () => {
    it('When get object storage plan by id is requested, then it should call with right params & return data', async () => {
      const callStub = sinon.stub(httpClient, 'get').resolves({
        id: 'plan_123',
      });
      const { client, headers } = basicHeadersAndClient();

      const body = await client.getObjectStoragePlanById('plan_123', 'eur');

      expect(callStub.firstCall.args).toEqual(['/object-storage-plan-by-id?planId=plan_123&currency=eur', headers]);
      expect(body).toEqual({ id: 'plan_123' });
    });
  });

  describe('Create customer for object storage', () => {
    it('When create customer is requested, then it should call with right params & return data', async () => {
      const callStub = sinon.stub(httpClient, 'post').resolves({
        customerId: 'cus_123',
      });
      const { client, headers } = basicHeadersAndClient();

      const body = await client.createCustomerForObjectStorage({
        name: 'test',
        email: 'test@test.com',
        country: 'US',
        companyVatId: '1234567890',
      });

      expect(callStub.firstCall.args).toEqual([
        '/create-customer-for-object-storage',
        { name: 'test', email: 'test@test.com', country: 'US', companyVatId: '1234567890' },
        headers,
      ]);
      expect(body).toEqual({ customerId: 'cus_123' });
    });
  });

  describe('Create object storage subscription', () => {
    it('When create subscription is requested, then it should call with right params & return data', async () => {
      const callStub = sinon.stub(httpClient, 'post').resolves({
        subscriptionId: 'sub_123',
      });

      const { client, headers } = basicHeadersAndClient();

      await client.createObjectStorageSubscription({
        customerId: 'cus_123',
        plan: { id: 'plan_123', bytes: 1000, interval: 'month', amount: 1000, currency: 'eur', decimalAmount: 10.0 },
        token: 'token',
        companyName: 'test',
        vatId: '1234567890',
        promoCodeId: 'promo_123',
      });

      expect(callStub.firstCall.args).toEqual([
        '/create-subscription-for-object-storage',
        {
          customerId: 'cus_123',
          priceId: 'plan_123',
          token: 'token',
          currency: 'eur',
          companyName: 'test',
          companyVatId: '1234567890',
          promoCodeId: 'promo_123',
        },
        headers,
      ]);
    });
  });
});

function basicHeadersAndClient(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
): {
  client: ObjectStorage;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };

  const client = ObjectStorage.client(apiUrl, appDetails);
  const headers = basicHeaders(clientName, clientVersion);
  return { client, headers };
}
