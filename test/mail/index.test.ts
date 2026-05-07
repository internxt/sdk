import { HttpClient } from '../../src/shared/http/client';
import { MailApi } from '../../src/mail/index';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { headersWithToken } from '../../src/shared/headers';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Mail service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
