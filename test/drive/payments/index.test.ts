import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Payments } from '../../../src/drive';
import { CreatePaymentSessionPayload, StripeSessionMode, UserType } from '../../../src/drive/payments/types/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';

describe('payments service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('get products', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        content: 'true',
      });

      const { client, headers } = clientAndHeadersWithToken({});

      // Act
      const body = await client.getProducts();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/v3/stripe/products', headers);
      expect(body).toEqual({
        content: 'true',
      });
    });
  });

  describe('getInvoices', () => {
    it('should call with right params & return data', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue([
        { id: 'invoice_123', amount: 1000 },
        { id: 'invoice_456', amount: 2000 },
      ]);

      const { client, headers } = clientAndHeadersWithToken({});

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

      expect(callStub).toHaveBeenCalledWith(`/invoices?${expectedQuery}`, headers);

      expect(invoices).toEqual([
        { id: 'invoice_123', amount: 1000 },
        { id: 'invoice_456', amount: 2000 },
      ]);
    });

    it('should handle missing optional parameters correctly', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue([]);

      const { client, headers } = clientAndHeadersWithToken({});

      const params = {};

      const expectedQuery = new URLSearchParams({
        userType: UserType.Individual,
      }).toString();

      const invoices = await client.getInvoices(params as any);

      expect(callStub).toHaveBeenCalledWith(`/invoices?${expectedQuery}`, headers);
      expect(invoices).toEqual([]);
    });
  });

  describe('check if product is available', () => {
    it('should call with right params & return data', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        featuresPerService: {
          antivirus: false,
        },
      });
      const { client, headers } = clientAndHeadersWithToken({ desktopHeader: 'desk-header' });

      const body = await client.checkUserAvailableProducts();

      expect(callStub).toHaveBeenCalledWith('/products', headers);
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
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        id: 'ident',
      });
      const { client, headers } = clientAndHeadersWithToken({});
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
      expect(callStub).toHaveBeenCalledWith(
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
      );
      expect(body).toEqual({
        id: 'ident',
      });
    });
  });

  describe('Get user used promotional codes', () => {
    it('When requesting a user redeemed promo codes, it returns the correct data with the right parameters', async () => {
      const response = { usedCoupons: ['PROMO_CODE', 'PROMO_CODE_1'] };
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(response);
      const { client, headers } = clientAndHeadersWithToken({});

      const body = await client.getPromoCodesUsedByUser();

      expect(callStub).toHaveBeenCalledWith('/customer/redeemed-promotion-codes', headers);
      expect(body).toEqual(response);
    });
  });
});

function clientAndHeadersWithToken({
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
  workspaceToken,
  desktopHeader,
}: {
  apiUrl?: string;
  clientName?: string;
  clientVersion?: string;
  token?: string;
  workspaceToken?: string;
  desktopHeader?: string;
}): {
  client: Payments;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
    desktopHeader: desktopHeader,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
    workspaceToken: workspaceToken,
  };

  const client = Payments.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({
    clientName: appDetails.clientName,
    clientVersion: appDetails.clientVersion,
    token: apiSecurity.token,
    workspaceToken: apiSecurity.workspaceToken,
    desktopToken: appDetails.desktopHeader,
    customHeaders: appDetails.customHeaders,
  });
  return { client, headers };
}
