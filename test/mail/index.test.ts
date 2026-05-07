import { HttpClient } from '../../src/shared/http/client';
import { Mail } from '../../src/mail/index';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { headersWithToken } from '../../src/shared/headers';
import {
  createEncryptionAndRecoveryKeystores,
  genSymmetricKey,
  KeystoreType,
  generateEmailKeys,
  Email,
  generateUuid,
  createPwdProtectedEmail,
  encryptEmailHybrid,
  uint8ArrayToBase64,
} from 'internxt-crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { decryptEmail, openPasswordProtectedEmail } from '../../src/mail/crypto';

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

    it('When a keystore upload is requested, then it should successfully upload the keystore', async () => {
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

    it('When keystore creation is requested, then it should create and upload two keystores', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      await client.createAndUploadKeystores(email, baseKey);

      expect(postCall.mock.calls[0]).toEqual([
        '/keystore',
        {
          encryptedKeystore: {
            userEmail: email,
            type: KeystoreType.ENCRYPTION,
            privateKeyEncrypted: expect.any(String),
            publicKey: expect.any(String),
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
            privateKeyEncrypted: expect.any(String),
            publicKey: expect.any(String),
          },
        },
        headers,
      ]);
    });
    it('When a keystore downloading is requested, then it should successfully download the keystore', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue({ encryptionKeystore });
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

    it('When user email keys are requested, then it should successfully download keystore and open it', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue(encryptionKeystore);
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

    it('When email key recovery is requested, then it should successfully download keystore and open it', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'getWithParams').mockResolvedValue(recoveryKeystore);
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
    const userA = 'user A email';
    const userB = 'user B email';
    const userC = 'user C email';
    const emailKeysA = await generateEmailKeys();
    const emailKeysB = await generateEmailKeys();
    const emailKeysC = await generateEmailKeys();

    const publicKeyA = uint8ArrayToBase64(emailKeysA.publicKey);
    const publicKeyB = uint8ArrayToBase64(emailKeysB.publicKey);
    const publicKeyC = uint8ArrayToBase64(emailKeysC.publicKey);

    it('When user email public keys are requested, then it should successfully get them', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi
        .spyOn(HttpClient.prototype, 'post')
        .mockResolvedValue([{ publicKey: publicKeyA, email: userA }]);
      const result = await client.getUserWithPublicKeys(userA);

      expect(postCall.mock.calls[0]).toEqual([
        '/users/public-keys',
        {
          emails: [userA],
        },
        headers,
      ]);
      expect(result).toStrictEqual({ email: userA, publicHybridKey: emailKeysA.publicKey });
    });

    it('When public keys are requested for several users, then it should successfully get all of them', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue([
        { publicKey: publicKeyA, email: userA },
        { publicKey: publicKeyB, email: userB },
        { publicKey: publicKeyC, email: userC },
      ]);
      const result = await client.getSeveralUsersWithPublicKeys([userA, userB, userC]);

      expect(postCall.mock.calls[0]).toEqual([
        '/users/public-keys',
        {
          emails: [userA, userB, userC],
        },
        headers,
      ]);
      expect(result).toEqual([
        { email: userA, publicHybridKey: emailKeysA.publicKey },
        { email: userB, publicHybridKey: emailKeysB.publicKey },
        { email: userC, publicHybridKey: emailKeysC.publicKey },
      ]);
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

    const emailKeysB = await generateEmailKeys();
    const publicKeyB = uint8ArrayToBase64(emailKeysB.publicKey);

    const email: Email = {
      id: uuid,
      body: {
        text: 'Email text',
        subject: 'Email subject',
        attachments: ['Email attachment'],
      },
      params: {
        createdAt: '2026-01-21T15:11:22.000Z',
        sender: userA,
        recipients: [userB],
        replyToEmailID: uuid,
        labels: ['inbox', 'test'],
      },
    };

    const pwd = 'mock password';

    it('When user request encrypting email, then it should successfully encrypt and send an email', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi
        .spyOn(HttpClient.prototype, 'post')
        .mockResolvedValueOnce([{ publicKey: publicKeyB, email: userB.email }])
        .mockResolvedValueOnce({});
      await client.e2eEncryptAndSendEmail(email);

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
          emails: [
            {
              encEmailBody: {
                encText: expect.any(String),
                encSubject: expect.any(String),
                encAttachments: [expect.any(String)],
              },
              encryptedKey: {
                encryptedKey: expect.any(String),
                hybridCiphertext: expect.any(String),
                encryptedForEmail: userB.email,
              },
            },
          ],
          params: email.params,
        },
        headers,
      ]);
    });

    it('When user request password protect email, then it should successfully protect and send an email', async () => {
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      await client.e2ePasswordProtectAndSendEmail(email, pwd);

      expect(postCall.mock.calls[0]).toEqual([
        '/emails',
        {
          email: {
            encryptedKey: {
              encryptedKey: expect.any(String),
              salt: expect.any(String),
            },
            encEmailBody: {
              encText: expect.any(String),
              encSubject: expect.any(String),
              encAttachments: [expect.any(String)],
            },
          },
          params: email.params,
        },
        headers,
      ]);
    });

    it('When user request opening a password protect email, then it should successfully open it', async () => {
      const encEmail = await createPwdProtectedEmail(email.body, pwd);
      const result = await openPasswordProtectedEmail(encEmail, pwd);

      expect(result).toEqual(email.body);
    });

    it('When user request decrypting an encrypted email, then it should successfully decrypt it', async () => {
      const recipient = { email: userB.email, publicHybridKey: emailKeysB.publicKey };
      const encEmail = await encryptEmailHybrid(email.body, recipient);
      const result = await decryptEmail(encEmail, emailKeysB.secretKey);

      expect(result).toEqual(email.body);
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
