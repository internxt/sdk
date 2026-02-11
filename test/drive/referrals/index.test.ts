import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { Referrals } from '../../../src/drive';
import { HttpClient } from '../../../src/shared/http/client';

describe('# users service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('get referrals', () => {
    it('should call with right params & return response', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        referrals: [1, 2],
      });

      // Act
      const body = await client.getReferrals();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/users-referrals', headers);
      expect(body).toEqual({
        referrals: [1, 2],
      });
    });
  });
});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
): {
  client: Referrals;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Referrals.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}
