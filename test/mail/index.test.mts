import sinon from 'sinon';
import { HttpClient } from '../../src/shared/http/client';
import { Mail } from '../../src/mail/index';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { headersWithToken } from '../../src/shared/headers';
import { createEncryptionAndRecoveryKeystores, genSymmetricKey } from 'internxt-crypto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const httpClient = HttpClient.create('');

describe('Mail service tests', () => {

  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createCall method', () => {
    it('should successfully create a call with token', async () => {
     
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'post').resolves({});

      const baseKey = genSymmetricKey();
      const { encryptionKeystore } = await createEncryptionAndRecoveryKeystores('test@internxt.com', baseKey);
      await client.uploadKeystoreToServer(encryptionKeystore);

expect(postCall.firstCall.args).toEqual([
        '/uploadKeystore',
        {
          encryptedKeystore: encryptionKeystore,
        },
        headers,
      ]);
    });
  });
});
 
function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
): {
  client: Mail;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName,
    clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token,
  };
  const client = Mail.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}