import { HttpClient } from '../../src/shared/http/client';
import { Mail } from '../../src/mail/index';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { headersWithToken } from '../../src/shared/headers';
import {
  createEncryptionAndRecoveryKeystores,
  genSymmetricKey,
  KeystoreType,
  generateEmailKeys,
  publicKeyToBase64,
  Email,
  generateUuid,
  createPwdProtectedEmail,
  encryptEmailHybrid,
} from 'internxt-crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Mail service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('test keystore call methods', async () => {
    const email = 'test@internxt.com';
    const baseKey = genSymmetricKey();
    const { encryptionKeystore, recoveryCodes, recoveryKeystore, keys } = await createEncryptionAndRecoveryKeystores(
      email,
      baseKey,
    );

    it('should successfully upload a keystore', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      await client.uploadKeystoreToServer(encryptionKeystore);

      expect(postCall.mock.calls[0]).toEqual([
        '/keystore',
        {
          encryptedKeystore: encryptionKeystore,
        },
        headers,
      ]);
    });

    it('should successfully create and upload a keystore', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      await client.createAndUploadKeystores(email, baseKey);

      expect(postCall.mock.calls[0]).toEqual([
        '/keystore',
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

      expect(postCall.mock.calls[1]).toEqual([
        '/keystore',
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
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({ encryptionKeystore });
      const result = await client.downloadKeystoreFromServer(email, KeystoreType.ENCRYPTION);

      expect(postCall.mock.calls[0]).toEqual([
        '/user/keystore',
        {
          userEmail: email,
          keystoreType: KeystoreType.ENCRYPTION,
        },
        headers,
      ]);
      expect(result).toEqual({ encryptionKeystore: encryptionKeystore });
    });

    it('should successfully open user email keys', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall =  vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(encryptionKeystore);
      const result = await client.getUserEmailKeys(email, baseKey);

      expect(postCall.mock.calls[0]).toEqual([
        '/user/keystore',
        {
          userEmail: email,
          keystoreType: KeystoreType.ENCRYPTION,
        },
        headers,
      ]);
      expect(result).toEqual(keys);
    });

    it('should successfully recover user email keys', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(recoveryKeystore);
      const result = await client.recoverUserEmailKeys(email, recoveryCodes);

      expect(postCall.mock.calls[0]).toEqual([
        '/user/keystore',
        {
          userEmail: email,
          keystoreType: KeystoreType.RECOVERY,
        },
        headers,
      ]);
      expect(result).toEqual(keys);
    });
  });

  describe('test public keys call methods', async () => {
    const userA = {
      email: 'user A email',
      name: 'user A name',
    };
    const userB = {
      email: 'user B email',
      name: 'user B name',
    };
    const userC = {
      email: 'user C email',
      name: 'user C name',
    };
    const emailKeysA = await generateEmailKeys();
    const emailKeysB = await generateEmailKeys();
    const emailKeysC = await generateEmailKeys();

    const userAwithKeys = { ...userA, publicKeys: emailKeysA.publicKeys };
    const userBwithKeys = { ...userB, publicKeys: emailKeysB.publicKeys };
    const userCwithKeys = { ...userC, publicKeys: emailKeysC.publicKeys };

    const emailKeysABase64 = await publicKeyToBase64(emailKeysA.publicKeys);
    const emailKeysBBase64 = await publicKeyToBase64(emailKeysB.publicKeys);
    const emailKeysCBase64 = await publicKeyToBase64(emailKeysC.publicKeys);

    it('should successfully get user public keys', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue([
        { publicKeys: emailKeysABase64, user: userA }]);
      const result = await client.getUserWithPublicKeys(userA.email);

      expect(postCall.mock.calls[0]).toEqual([
        '/users/public-keys',
        {
          emails: [userA.email],
        },
        headers,
      ]);
      expect(result).toStrictEqual(userAwithKeys);
    });

    it('should successfully get public keys of several users', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue([
        { publicKeys: emailKeysABase64, user: userA },
        { publicKeys: emailKeysBBase64, user: userB },
        { publicKeys: emailKeysCBase64, user: userC },
      ]);
      const result = await client.getSeveralUsersWithPublicKeys([userA.email, userB.email, userC.email]);

      expect(postCall.mock.calls[0]).toEqual([
        '/users/public-keys',
        {
          emails: [userA.email, userB.email, userC.email],
        },
        headers,
      ]);
      expect(result).toEqual([userAwithKeys, userBwithKeys, userCwithKeys]);
    });
  });

  describe('test email call methods', async () => {
    const userA = {
      email: 'user A email',
      name: 'user A name',
    };

    const userB = {
      email: 'user B email',
      name: 'user B name',
    };
    const uuid = generateUuid();

    const emailKeysA = await generateEmailKeys();
    const emailKeysB = await generateEmailKeys();
    const emailKeysABase64 = await publicKeyToBase64(emailKeysA.publicKeys);
    const emailKeysBBase64 = await publicKeyToBase64(emailKeysB.publicKeys);

    const email: Email = {
      id: uuid,
      body: {
        text: 'Email text',
        attachments: ['Email attachement'],
      },
      params: {
        subject: 'Email subject',
        createdAt: '2026-01-21T15:11:22.000Z',
        sender: userA,
        recipient: userB,
        recipients: [userB],
        replyToEmailID: uuid,
        labels: ['inbox', 'test'],
      },
    };

    const pwd = 'mock password';

    it('should successfully encrypt and send an email', async () => {
      const { client, headers } = clientAndHeadersWithToken();
    const postCall = vi.spyOn(HttpClient.prototype, 'post')
  .mockResolvedValueOnce([{ publicKeys: emailKeysBBase64, user: userB }])
  .mockResolvedValueOnce({});
      await client.encryptAndSendEmail(email, emailKeysA.privateKeys, false);

      expect(postCall.mock.calls[0]).toEqual([
        '/users/public-keys',
        {
          emails: [userB.email],
        },
        headers,
      ]);

      expect(postCall.mock.calls[1]).toEqual([
        '/emails',
        {
          emails: [ {
            encryptedKey: {
              kyberCiphertext: expect.any(String),
              encryptedKey: expect.any(String),
            },
            enc: {
              encText: expect.any(String),
              encAttachments: [expect.any(String)],
            },
            recipientEmail: userB.email,
            params: email.params,
            id: email.id,
            isSubjectEncrypted: false,
          }],  
        },
        headers,
      ]);
    });

    it('should successfully password protect and send an email', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      await client.passwordProtectAndSendEmail(email, pwd, false);

      expect(postCall.mock.calls[0]).toEqual([
        '/emails',
        {
          email: {
            encryptedKey: {
              encryptedKey: expect.any(String),
              salt: expect.any(String),
            },
            enc: {
              encText: expect.any(String),
              encAttachments: [expect.any(String)],
            },
            params: email.params,
            id: email.id,
            isSubjectEncrypted: false,
          },
        },
        headers,
      ]);
    });

    it('should successfully open password protected email', async () => {
      const { client } = clientAndHeadersWithToken();
      const encEmail = await createPwdProtectedEmail(email, pwd, true);
      const result = await client.openPasswordProtectedEmail(encEmail, pwd);

      expect(result).toEqual(email);
    });

    it('should successfully decrypt encrypted email', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const recipient = { ...userB, publicKeys: emailKeysB.publicKeys };
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue([
        { publicKeys: emailKeysABase64, user: userA }]);
      const encEmail = await encryptEmailHybrid(email, recipient, emailKeysA.privateKeys, true);
      const result = await client.decryptEmail(encEmail, emailKeysB.privateKeys);

      expect(postCall.mock.calls[0]).toEqual([
        '/users/public-keys',
        {
          emails: [userA.email],
        },
        headers,
      ]);

      expect(result).toEqual(email);
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
