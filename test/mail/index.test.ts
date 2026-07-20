import { HttpClient } from '../../src/shared/http/client';
import { MailApi } from '../../src/mail/index';
import type { MailAccountResponse } from '../../src/mail/types';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { headersWithToken } from '../../src/shared/headers';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Mail service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMailAccount', () => {
    it('When the account is active, then it should GET /users/me/mail-account and return the account', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const response: MailAccountResponse = {
        id: 'account-1',
        defaultAddress: 'jane@inxt.me',
        status: 'active',
      };
      const getStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(response);

      const result = await client.getMailAccount();

      expect(getStub).toHaveBeenCalledWith('/users/me/mail-account', headers);
      expect(result).toEqual(response);
    });

    it('When the account is suspended, then it should return suspendedAt and deletionAt timestamps', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const response: MailAccountResponse = {
        id: 'account-1',
        defaultAddress: 'jane@inxt.me',
        status: 'suspended',
        suspendedAt: '2026-05-01T00:00:00.000Z',
        deletionAt: '2026-06-01T00:00:00.000Z',
      };
      const getStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(response);

      const result = await client.getMailAccount();

      expect(getStub).toHaveBeenCalledWith('/users/me/mail-account', headers);
      expect(result).toEqual(response);
    });

    it('When the HTTP client throws, then the error should propagate', async () => {
      const { client } = clientAndHeadersWithToken();
      vi.spyOn(HttpClient.prototype, 'get').mockRejectedValue(new Error('Unauthorized'));

      await expect(client.getMailAccount()).rejects.toThrow('Unauthorized');
    });
  });

  describe('test mail account setup', () => {
    it('When a mail account setup is requested, then it should POST to /users/me/mail-account and return the created address', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({ address: 'user@domain.com' });
      const payload = {
        address: 'user',
        domain: 'domain.com',
        displayName: 'User',
        password: 'mail-password',
        keys: {
          publicKey: 'public-key',
          encryptionPrivateKey: 'encryption-private-key',
          recoveryPrivateKey: 'recovery-private-key',
        },
      };

      const result = await client.setupMailAccount(payload);

      expect(postStub).toHaveBeenCalledWith('/users/me/mail-account', payload, headers);
      expect(result).toEqual({ address: 'user@domain.com' });
    });

    it('When the mail account keys are requested with an address, then it should GET /users/me/mail-account/keys with that address', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const expectedKeys = {
        address: 'user@domain.com',
        publicKey: 'public-key',
        encryptionPrivateKey: 'encryption-private-key',
        recoveryPrivateKey: 'recovery-private-key',
      };
      const getStub = vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue(expectedKeys);

      const result = await client.getMailAccountKeys('user@domain.com');

      expect(getStub).toHaveBeenCalledWith('/users/me/mail-account/keys', { address: 'user@domain.com' }, headers);
      expect(result).toEqual(expectedKeys);
    });

    it('When the mail account keys are requested without an address, then it should GET /users/me/mail-account/keys without query params', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const expectedKeys = {
        address: 'user@domain.com',
        publicKey: 'public-key',
        encryptionPrivateKey: 'encryption-private-key',
        recoveryPrivateKey: 'recovery-private-key',
      };
      const getStub = vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue(expectedKeys);

      const result = await client.getMailAccountKeys();

      expect(getStub).toHaveBeenCalledWith('/users/me/mail-account/keys', {}, headers);
      expect(result).toEqual(expectedKeys);
    });
  });

  describe('checkAddressAvailability', () => {
    it('When the address is free, then it should GET /addresses/availability with username and domain', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const response = { available: true, suggestion: null };
      const getStub = vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue(response);

      const result = await client.checkAddressAvailability('jane.doe', 'inxt.me');

      expect(getStub).toHaveBeenCalledWith(
        '/addresses/availability',
        { username: 'jane.doe', domain: 'inxt.me' },
        headers,
      );
      expect(result).toEqual(response);
    });

    it('When the address is taken, then it should return the suggested alternative address', async () => {
      const { client } = clientAndHeadersWithToken();
      const response = { available: false, suggestion: 'jane.doe1@inxt.me' };
      vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue(response);

      const result = await client.checkAddressAvailability('jane.doe', 'inxt.me');

      expect(result).toEqual(response);
    });

    it('When the HTTP client throws, then the error should propagate', async () => {
      const { client } = clientAndHeadersWithToken();
      vi.spyOn(HttpClient.prototype, 'getWithParams').mockRejectedValue(new Error('Too Many Requests'));

      await expect(client.checkAddressAvailability('jane.doe', 'inxt.me')).rejects.toThrow('Too Many Requests');
    });
  });
});

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
): {
  client: MailApi;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName,
    clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token,
  };
  const client = MailApi.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}
