import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Payments } from '../../../src/drive';
import { UserType } from '../../../src/drive/payments/types/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';

describe('payments service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
