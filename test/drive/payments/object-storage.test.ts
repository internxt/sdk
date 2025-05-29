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

      expect(callStub.firstCall.args).toEqual(['/object-storage/price?planId=plan_123&currency=eur', headers]);
      expect(body).toEqual({ id: 'plan_123' });
    });
  });

  describe('Create customer for object storage', () => {
    it('When create customer is requested, then it should call with right params & return data', async () => {
      const callStub = sinon.stub(httpClient, 'get').resolves({
        customerId: 'cus_123',
      });
      const { client, headers } = basicHeadersAndClient();

      const body = await client.getObjectStorageCustomerId({
        customerName: 'test',
        postalCode: '123456',
        email: 'test@test.com',
        country: 'US',
        companyVatId: '1234567890',
      });

      const customerName = 'test';
      const postalCode = '123456';
      const email = 'test@test.com';
      const country = 'US';
      const companyVatId = '1234567890';

      const query = new URLSearchParams();
      query.set('customerName', customerName);
      query.set('email', email);
      query.set('postalCode', postalCode);
      query.set('country', country);
      query.set('companyVatId', companyVatId);

      expect(callStub.firstCall.args).toEqual([`/object-storage/customer?${query.toString()}`, headers]);
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
        priceId: 'price_id',
        currency: 'eur',
        token: 'token',
        promoCodeId: 'promo_123',
      });

      expect(callStub.firstCall.args).toEqual([
        '/object-storage/subscription',
        {
          customerId: 'cus_123',
          priceId: 'price_id',
          token: 'token',
          currency: 'eur',
          promoCodeId: 'promo_123',
        },
        headers,
      ]);
    });
  });

  describe('Verifying the user payment method', () => {
    it("When the user wants to verify the payment method and it's verified, then an object indicating so is returned", async () => {
      const callStub = sinon.stub(httpClient, 'post').resolves({
        intentId: 'intent_id',
        verified: true,
      });

      const { client, headers } = basicHeadersAndClient();

      const result = await client.paymentMethodVerification({
        customerId: 'cus_123',
        priceId: 'price_id',
        currency: 'eur',
        token: 'token',
        paymentMethod: 'pm123',
      });

      expect(callStub.firstCall.args).toEqual([
        '/payment-method-verification',
        {
          customerId: 'cus_123',
          priceId: 'price_id',
          currency: 'eur',
          token: 'token',
          paymentMethod: 'pm123',
        },
        headers,
      ]);

      expect(result).toEqual({ intentId: 'intent_id', verified: true });
    });

    it("When the user wants to verify the payment method and it's not verified, then an object indicating so is returned", async () => {
      const callStub = sinon.stub(httpClient, 'post').resolves({
        intentId: '',
        verified: false,
        clientSecret: 'client_secret',
      });

      const { client, headers } = basicHeadersAndClient();

      const result = await client.paymentMethodVerification({
        customerId: 'cus_123',
        priceId: 'price_id',
        currency: 'eur',
        token: 'token',
        paymentMethod: 'pm123',
      });

      expect(callStub.firstCall.args).toEqual([
        '/payment-method-verification',
        {
          customerId: 'cus_123',
          priceId: 'price_id',
          currency: 'eur',
          token: 'token',
          paymentMethod: 'pm123',
        },
        headers,
      ]);

      expect(result).toEqual({ intentId: '', verified: false, clientSecret: 'client_secret' });
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
