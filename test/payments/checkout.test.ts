import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../src/shared/http/client';
import { Checkout } from '../../src/payments';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { basicHeaders, headersWithToken } from '../../src/shared/headers';
import {
  CreateCustomerPayload,
  CreateCustomerWithoutAccountPayload,
  CreatePaymentIntentPayload,
  CryptoCurrency,
} from '../../src/payments/types';

describe('Checkout service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Create customer ID', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const userPayload: CreateCustomerPayload = {
        customerName: 'example',
        city: 'Valencia',
        lineAddress1: 'Marina de empresas',
        lineAddress2: '',
        country: 'ES',
        postalCode: '14005',
        captchaToken: 'captcha_token',
      };
      const mockedResponse = {
        customerId: 'customerId',
        token: 'valid_token',
      };

      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue([mockedResponse]);

      const { client, headers } = clientAndHeadersWithAuthToken({});

      // Act
      const body = await client.createCustomer(userPayload);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/checkout/customer', userPayload, headers);
      expect(body).toStrictEqual([mockedResponse]);
    });
  });

  describe('Create customer for someone without an account', () => {
    const customerPayload: CreateCustomerWithoutAccountPayload = {
      email: 'new-user@internxt.com',
      confirmationTokenId: 'ctoken_123',
      customerName: 'New user',
      country: 'ES',
      postalCode: '46001',
      captchaToken: 'captcha_token',
    };

    it('When someone without an account creates a customer, then it is sent without user authorization', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeadersWithToken({});

      await client.createCustomerWithoutAccount(customerPayload);

      expect(callStub).toHaveBeenCalledWith('/checkout/customer', customerPayload, headers);
      expect(callStub.mock.calls[0][2]).not.toHaveProperty('Authorization');
    });

    it('When the customer is created, then the customer id and the checkout token are returned', async () => {
      const createdCustomer = { customerId: 'customerId', token: 'checkout_token' };
      vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(createdCustomer);
      const { client } = clientAndHeadersWithToken({});

      const customer = await client.createCustomerWithoutAccount(customerPayload);

      expect(customer).toStrictEqual(createdCustomer);
    });

    it('When a signed-in user creates a customer, then it is authorized with their token as before', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeadersWithAuthToken({ token: 'session_token' });

      await client.createCustomer({ country: 'ES', captchaToken: 'captcha_token' });

      const [, body, sentHeaders] = callStub.mock.calls[0];
      expect(sentHeaders).toStrictEqual(headers);
      expect(sentHeaders).toHaveProperty('Authorization', 'Bearer session_token');
      expect(body).not.toHaveProperty('email');
      expect(body).not.toHaveProperty('confirmationTokenId');
    });
  });

  describe('Create payment intent', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const userPayload: CreatePaymentIntentPayload = {
        customerId: 'customer-id',
        priceId: 'price-id',
        token: 'user-token',
        currency: 'eur',
        captchaToken: 'captcha-token',
        userAddress: '1.1.1.1',
        promoCodeId: 'promo-code',
      };
      const mockedResponse = {
        id: 'invoice-id',
        type: 'fiat',
        clientSecret: 'client-secret',
        invoiceStatus: 'paid',
      };

      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue([mockedResponse]);

      const { client, headers } = clientAndHeadersWithAuthToken({});

      // Act
      const body = await client.createPaymentIntent(userPayload);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/checkout/payment-intent', userPayload, headers);
      expect(body).toStrictEqual([mockedResponse]);
    });
  });

  describe('Fetch available crypto currencies', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const mockedCryptoCurrency: CryptoCurrency = {
        currencyId: 'some-id',
        imageUrl: 'http://some-url',
        name: 'Bitcoin',
        networks: [
          {
            platformId: 'bitcoin',
            name: 'Bitcoin Network',
          },
        ],
        receiveType: true,
        type: 'crypto',
      };
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue([mockedCryptoCurrency]);

      const { client, headers } = clientAndHeadersWithToken({});

      // Act
      const body = await client.getAvailableCryptoCurrencies();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/checkout/crypto/currencies', headers);
      expect(body).toStrictEqual([mockedCryptoCurrency]);
    });
  });

  describe('Verify crypto payments', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const mockedInvoiceId = 'encoded-invoice-id';
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(true);

      const { client, headers } = clientAndHeadersWithAuthToken({});

      // Act
      const body = await client.verifyCryptoPayment(mockedInvoiceId);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/checkout/crypto/verify/payment', { token: mockedInvoiceId }, headers);
      expect(body).toStrictEqual(true);
    });
  });
});

function clientAndHeadersWithToken({
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
  desktopHeader,
}: {
  apiUrl?: string;
  clientName?: string;
  clientVersion?: string;
  token?: string;
  desktopHeader?: string;
}): {
  client: Checkout;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
    desktopHeader: desktopHeader,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };

  const client = Checkout.client(apiUrl, appDetails, apiSecurity);
  const headers = basicHeaders({ clientName, clientVersion, desktopToken: desktopHeader });
  return { client, headers };
}

function clientAndHeadersWithAuthToken({
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
  desktopHeader,
}: {
  apiUrl?: string;
  clientName?: string;
  clientVersion?: string;
  token?: string;
  desktopHeader?: string;
}): {
  client: Checkout;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
    desktopHeader: desktopHeader,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };

  const client = Checkout.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token, desktopToken: desktopHeader });
  return { client, headers };
}
