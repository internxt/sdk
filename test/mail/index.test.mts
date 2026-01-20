import sinon from 'sinon';
import { HttpClient } from '../../src/shared/http/client';
import { Mail } from '../../src/mail/index';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { headersWithToken } from '../../src/shared/headers';
import { createEncryptionAndRecoveryKeystores, genSymmetricKey, KeystoreType } from 'internxt-crypto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const httpClient = HttpClient.create('');

describe('Mail service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('test keystore call methods', async () => {
    const email = 'test@internxt.com';
    const baseKey = genSymmetricKey();
    const { encryptionKeystore } = await createEncryptionAndRecoveryKeystores(email, baseKey);

    it('should successfully upload a keystore', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'post').resolves({});
      await client.uploadKeystoreToServer(encryptionKeystore);

      expect(postCall.firstCall.args).toEqual([
        '/uploadKeystore',
        {
          encryptedKeystore: encryptionKeystore,
        },
        headers,
      ]);
    });

    it('should successfully create and upload a keystore', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'post').resolves({});
      await client.createAndUploadKeystores(email, baseKey);

      expect(postCall.firstCall.args).toEqual([
        '/uploadKeystore',
        {
          encryptedKeystore: {
            userEmail: email,
            type: KeystoreType.ENCRYPTION,
            encryptedKeys: expect.objectContaining({
              publicKeys: { eccPublicKeyBase64: expect.any(String), kyberPublicKeyBase64: expect.any(String) },
              privateKeys: {
                eccPrivateKeyBase64: expect.any(String),
                kyberPrivateKeyBase64: expect.any(String),
              },
            }),
          },
        },
        headers,
      ]);

      expect(postCall.secondCall.args).toEqual([
        '/uploadKeystore',
        {
          encryptedKeystore: {
            userEmail: email,
            type: KeystoreType.RECOVERY,
            encryptedKeys: expect.objectContaining({
              publicKeys: { eccPublicKeyBase64: expect.any(String), kyberPublicKeyBase64: expect.any(String) },
              privateKeys: {
                eccPrivateKeyBase64: expect.any(String),
                kyberPrivateKeyBase64: expect.any(String),
              },
            }),
          },
        },
        headers,
      ]);
    });
    it('should successfully download a keystore', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'getWithParams').resolves({ encryptionKeystore });
      const result = await client.downloadKeystoreFromServer(email, KeystoreType.ENCRYPTION);

      expect(postCall.firstCall.args).toEqual([
        '/getKeystore',
        {
          userEmail: email,
          keystoreType: KeystoreType.ENCRYPTION,
        },
        headers,
      ]);
      expect(result).toEqual({ encryptionKeystore: encryptionKeystore });
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
