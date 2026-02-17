import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyRegisterDetails } from './registerDetails.mother';
import { basicHeaders, headersWithToken } from '../../src/shared/headers';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { HttpClient } from '../../src/shared/http/client';
import { Auth, CryptoProvider, Keys, LoginDetails, Password, RegisterDetails, Token } from '../../src/auth';

describe('# auth service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('-> register use case', () => {
    it('Should have all the correct params on call', async () => {
      // Arrange
      const registerDetails: RegisterDetails = emptyRegisterDetails();
      registerDetails.name = '1';
      registerDetails.lastname = '2';
      registerDetails.email = '3';
      registerDetails.password = '4';
      registerDetails.mnemonic = '5';
      registerDetails.salt = '6';
      registerDetails.keys.ecc.privateKeyEncrypted = '7';
      registerDetails.keys.ecc.publicKey = '8';
      registerDetails.keys.kyber.privateKeyEncrypted = '9';
      registerDetails.keys.kyber.publicKey = '10';
      registerDetails.keys.revocationCertificate = '11';
      registerDetails.captcha = '12';

      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();

      // Act
      await client.register(registerDetails);

      // Assert
      expect(postCall).toHaveBeenCalledWith(
        '/users',
        {
          name: registerDetails.name,
          lastname: registerDetails.lastname,
          email: registerDetails.email,
          password: registerDetails.password,
          mnemonic: registerDetails.mnemonic,
          salt: registerDetails.salt,
          privateKey: registerDetails.keys.privateKeyEncrypted,
          publicKey: registerDetails.keys.publicKey,
          revocationKey: registerDetails.keys.revocationCertificate,
          keys: {
            ecc: {
              publicKey: registerDetails.keys.ecc.publicKey,
              privateKey: registerDetails.keys.ecc.privateKeyEncrypted,
            },
            kyber: {
              publicKey: registerDetails.keys.kyber.publicKey,
              privateKey: registerDetails.keys.kyber.privateKeyEncrypted,
            },
          },
          referral: registerDetails.referral,
          referrer: registerDetails.referrer,
          captcha: registerDetails.captcha,
        },
        headers,
      );
    });

    it('Should resolve valid on valid response', async () => {
      // Arrange
      vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        valid: true,
      });
      const { client } = clientAndHeaders();
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const body = await client.register(registerDetails);

      // Assert
      expect(body).toEqual({
        valid: true,
      });
    });
  });

  describe('-> registerWithoutKeys use case', () => {
    it('Should have all the correct params on call without including keys', async () => {
      // Arrange
      const registerDetails: RegisterDetails = emptyRegisterDetails();
      registerDetails.name = '1';
      registerDetails.lastname = '2';
      registerDetails.email = '3';
      registerDetails.password = '4';
      registerDetails.mnemonic = '5';
      registerDetails.salt = '6';
      registerDetails.keys.ecc.privateKeyEncrypted = '7';
      registerDetails.keys.ecc.publicKey = '8';
      registerDetails.keys.kyber.privateKeyEncrypted = '9';
      registerDetails.keys.kyber.publicKey = '10';
      registerDetails.keys.revocationCertificate = '11';
      registerDetails.captcha = '12';

      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();

      // Act
      await client.registerWithoutKeys(registerDetails);

      // Assert
      expect(postCall).toHaveBeenCalledWith(
        '/users',
        {
          name: registerDetails.name,
          lastname: registerDetails.lastname,
          email: registerDetails.email,
          password: registerDetails.password,
          mnemonic: registerDetails.mnemonic,
          salt: registerDetails.salt,
          referral: registerDetails.referral,
          referrer: registerDetails.referrer,
          captcha: registerDetails.captcha,
        },
        headers,
      );
    });

    it('Should resolve valid on valid response', async () => {
      // Arrange
      vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        valid: true,
      });
      const { client } = clientAndHeaders();
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const body = await client.registerWithoutKeys(registerDetails);

      // Assert
      expect(body).toEqual({
        valid: true,
      });
    });
  });

  describe('-> pre-register use case', () => {
    it('Should have all the correct params on call', async () => {
      // Arrange
      const registerDetails: RegisterDetails = emptyRegisterDetails();
      registerDetails.name = '1';
      registerDetails.lastname = '2';
      registerDetails.email = '3';
      registerDetails.password = '4';
      registerDetails.mnemonic = '5';
      registerDetails.salt = '6';
      registerDetails.keys.ecc.privateKeyEncrypted = '7';
      registerDetails.keys.ecc.publicKey = '8';
      registerDetails.keys.kyber.privateKeyEncrypted = '9';
      registerDetails.keys.kyber.publicKey = '10';
      registerDetails.keys.revocationCertificate = '11';
      registerDetails.captcha = '12';

      const mockInvitatioId = 'invitationId';

      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();

      // Act
      await client.registerPreCreatedUser({ ...registerDetails, invitationId: mockInvitatioId });

      // Assert
      expect(postCall).toHaveBeenCalledWith(
        'users/pre-created-users/register',
        {
          name: registerDetails.name,
          lastname: registerDetails.lastname,
          email: registerDetails.email,
          password: registerDetails.password,
          mnemonic: registerDetails.mnemonic,
          salt: registerDetails.salt,
          privateKey: registerDetails.keys.privateKeyEncrypted,
          publicKey: registerDetails.keys.publicKey,
          revocationKey: registerDetails.keys.revocationCertificate,
          keys: {
            ecc: {
              publicKey: registerDetails.keys.ecc.publicKey,
              privateKey: registerDetails.keys.ecc.privateKeyEncrypted,
            },
            kyber: {
              publicKey: registerDetails.keys.kyber.publicKey,
              privateKey: registerDetails.keys.kyber.privateKeyEncrypted,
            },
          },
          referral: registerDetails.referral,
          referrer: registerDetails.referrer,
          captcha: registerDetails.captcha,
          invitationId: mockInvitatioId,
        },
        headers,
      );
    });

    it('Should resolve valid on valid response', async () => {
      // Arrange
      vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        valid: true,
      });
      const { client } = clientAndHeaders();
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const body = await client.register(registerDetails);

      // Assert
      expect(body).toEqual({
        valid: true,
      });
    });
  });

  describe('-> registerPreCreatedUserWithoutKeys use case', () => {
    it('Should have all the correct params on call without including keys', async () => {
      // Arrange
      const registerDetails: RegisterDetails = emptyRegisterDetails();
      registerDetails.name = '1';
      registerDetails.lastname = '2';
      registerDetails.email = '3';
      registerDetails.password = '4';
      registerDetails.mnemonic = '5';
      registerDetails.salt = '6';
      registerDetails.keys.ecc.privateKeyEncrypted = '7';
      registerDetails.keys.ecc.publicKey = '8';
      registerDetails.keys.kyber.privateKeyEncrypted = '9';
      registerDetails.keys.kyber.publicKey = '10';
      registerDetails.keys.revocationCertificate = '11';
      registerDetails.captcha = '12';

      const mockInvitatioId = 'invitationId';

      const postCall = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();

      // Act
      await client.registerPreCreatedUserWithoutKeys({ ...registerDetails, invitationId: mockInvitatioId });

      // Assert
      expect(postCall).toHaveBeenCalledWith(
        'users/pre-created-users/register',
        {
          name: registerDetails.name,
          lastname: registerDetails.lastname,
          email: registerDetails.email,
          password: registerDetails.password,
          mnemonic: registerDetails.mnemonic,
          salt: registerDetails.salt,
          referral: registerDetails.referral,
          referrer: registerDetails.referrer,
          captcha: registerDetails.captcha,
          invitationId: mockInvitatioId,
        },
        headers,
      );
    });

    it('Should resolve valid on valid response', async () => {
      // Arrange
      vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        valid: true,
      });
      const { client } = clientAndHeaders();
      const registerDetails: RegisterDetails = emptyRegisterDetails();
      const mockInvitatioId = 'invitationId';

      // Act
      const body = await client.registerPreCreatedUserWithoutKeys({
        ...registerDetails,
        invitationId: mockInvitatioId,
      });

      // Assert
      expect(body).toEqual({
        valid: true,
      });
    });
  });

  describe('-> login use case', () => {
    it('Should bubble up the error on first call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      vi.spyOn(HttpClient.prototype, 'post').mockRejectedValue(error);
      const { client } = clientAndHeaders();
      const loginDetails: LoginDetails = {
        email: '',
        password: '',
        tfaCode: undefined,
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: '',
            ecc: {
              publicKey: '',
              privateKeyEncrypted: '',
            },
            kyber: {
              publicKey: '',
              privateKeyEncrypted: '',
            },
          };
          return Promise.resolve(keys);
        },
      };

      // Act
      const call = client.login(loginDetails, cryptoProvider);

      // Assert
      await expect(call).rejects.toEqual(error);
    });

    it('Should bubble up the error on second call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      const { client } = clientAndHeaders();
      const loginDetails: LoginDetails = {
        email: '',
        password: '',
        tfaCode: undefined,
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: '',
            ecc: {
              publicKey: '',
              privateKeyEncrypted: '',
            },
            kyber: {
              publicKey: '',
              privateKeyEncrypted: '',
            },
          };
          return Promise.resolve(keys);
        },
      };
      const postStub = vi.spyOn(HttpClient.prototype, 'post');
      postStub
        .mockResolvedValueOnce({
          sKey: 'encrypted_salt',
        })
        .mockRejectedValueOnce(error);

      // Act
      const call = client.login(loginDetails, cryptoProvider);

      // Assert
      await expect(call).rejects.toEqual(error);
    });

    it('Should call access with correct parameters', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const loginDetails: LoginDetails = {
        email: 'my_email',
        password: 'password',
        tfaCode: undefined,
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: (password, encryptedSalt) => password + '-' + encryptedSalt,
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: 'priv',
            publicKey: 'pub',
            revocationCertificate: 'rev',
            ecc: {
              publicKey: 'pub',
              privateKeyEncrypted: 'priv',
            },
            kyber: {
              publicKey: 'pubKyber',
              privateKeyEncrypted: 'privKyber',
            },
          };
          return Promise.resolve(keys);
        },
      };
      const postStub = vi.spyOn(HttpClient.prototype, 'post');
      postStub
        .mockResolvedValueOnce({
          sKey: 'encrypted_salt',
        })
        .mockResolvedValueOnce({
          user: {
            revocateKey: 'key',
          },
        });

      // Act
      const body = await client.login(loginDetails, cryptoProvider);

      // Assert
      expect(postStub).toHaveBeenCalledTimes(2);
      expect(postStub).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: loginDetails.email,
        },
        headers,
      );
      expect(postStub).toHaveBeenCalledWith(
        '/auth/login/access',
        {
          email: loginDetails.email,
          password: 'password-encrypted_salt',
          tfa: loginDetails.tfaCode,
          privateKey: 'priv',
          publicKey: 'pub',
          revocateKey: 'rev',
          keys: {
            ecc: {
              publicKey: 'pub',
              privateKey: 'priv',
            },
            kyber: {
              publicKey: 'pubKyber',
              privateKey: 'privKyber',
            },
          },
        },
        headers,
      );
      expect(body).toEqual({
        user: {
          revocateKey: 'key',
          revocationKey: 'key',
        },
      });
    });
  });

  describe('-> loginWithoutKeys use case', () => {
    it('Should call access with correct parameters without keys', async () => {
      // Arrange
      const { client, headers } = clientAndHeaders();
      const loginDetails: LoginDetails = {
        email: 'my_email',
        password: 'password',
        tfaCode: undefined,
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: (password, encryptedSalt) => password + '-' + encryptedSalt,
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: 'priv',
            publicKey: 'pub',
            revocationCertificate: 'rev',
            ecc: {
              publicKey: 'pub',
              privateKeyEncrypted: 'priv',
            },
            kyber: {
              publicKey: 'pubKyber',
              privateKeyEncrypted: 'privKyber',
            },
          };
          return Promise.resolve(keys);
        },
      };
      const postStub = vi.spyOn(HttpClient.prototype, 'post');
      postStub
        .mockResolvedValueOnce({
          sKey: 'encrypted_salt',
        })
        .mockResolvedValueOnce({
          user: {
            revocateKey: 'key',
          },
        });

      // Act
      const body = await client.loginWithoutKeys(loginDetails, cryptoProvider);

      // Assert
      expect(postStub).toHaveBeenCalledTimes(2);
      expect(postStub).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: loginDetails.email,
        },
        headers,
      );
      expect(postStub).toHaveBeenCalledWith(
        '/auth/login/access',
        {
          email: loginDetails.email,
          password: 'password-encrypted_salt',
          tfa: loginDetails.tfaCode,
        },
        headers,
      );
      expect(body).toEqual({
        user: {
          revocateKey: 'key',
          revocationKey: 'key',
        },
      });
    });

    it('Should bubble up the error on first call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      vi.spyOn(HttpClient.prototype, 'post').mockRejectedValue(error);
      const { client } = clientAndHeaders();
      const loginDetails: LoginDetails = {
        email: '',
        password: '',
        tfaCode: undefined,
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: '',
            ecc: {
              publicKey: '',
              privateKeyEncrypted: '',
            },
            kyber: {
              publicKey: '',
              privateKeyEncrypted: '',
            },
          };
          return Promise.resolve(keys);
        },
      };

      // Act
      const call = client.loginWithoutKeys(loginDetails, cryptoProvider);

      // Assert
      await expect(call).rejects.toEqual(error);
    });
  });

  describe('-> update keys use case', () => {
    it('Should have a header with the auth token', async () => {
      // Arrange
      const token: Token = 'my-secure-token';
      const { client, headers } = clientAndHeadersWithToken('', 'name', '0.1', token);
      const keys: Keys = {
        privateKeyEncrypted: 'prik',
        publicKey: 'pubk',
        revocationCertificate: 'crt',
        ecc: {
          publicKey: 'pub',
          privateKeyEncrypted: 'priv',
        },
        kyber: {
          publicKey: 'pubKyber',
          privateKeyEncrypted: 'privKyber',
        },
      };
      const axiosStub = vi.spyOn(HttpClient.prototype, 'patch').mockResolvedValue({});

      // Act
      await client.updateKeys(keys, token);

      // Assert
      expect(axiosStub).toHaveBeenCalledWith(
        '/user/keys',
        {
          publicKey: 'pubk',
          privateKey: 'prik',
          revocationKey: 'crt',
          ecc: {
            publicKey: 'pub',
            privateKey: 'priv',
          },
          kyber: {
            publicKey: 'pubKyber',
            privateKey: 'privKyber',
          },
        },
        headers,
      );
    });
  });

  describe('-> security details', () => {
    it('Should call with right parameters & return correct content', async () => {
      // Arrange
      const postStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        hasKeys: true,
        sKey: 'gibberish',
        tfa: true,
        useOpaqueLogin: true,
      });
      const { client, headers } = clientAndHeaders();
      const email = 'my@email.com';

      // Act
      const body = await client.securityDetails(email);

      // Assert
      expect(postStub).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: email,
        },
        headers,
      );
      expect(body).toEqual({
        encryptedSalt: 'gibberish',
        tfaEnabled: true,
        useOpaqueLogin: true,
      });
    });

    it('Should return boolean value on null param response', async () => {
      // Arrange
      vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({
        hasKeys: true,
        sKey: 'gibberish',
        tfa: null,
      });
      const { client } = clientAndHeaders();
      const email = 'my@email.com';

      // Act
      const body = await client.securityDetails(email);

      // Assert
      expect(body).toEqual({
        encryptedSalt: 'gibberish',
        tfaEnabled: false,
        useOpaqueLogin: false,
      });
    });
  });

  describe('-> generate twoFactorAuth code', () => {
    it('Should call with right params & return data', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        qr: 'qr',
        code: 'code',
      });
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.generateTwoFactorAuthQR();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/auth/tfa', headers);
      expect(body).toEqual({
        qr: 'qr',
        backupKey: 'code',
      });
    });
  });

  describe('-> disable twoFactorAuth', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({});
      const { client, headers } = clientAndHeadersWithToken();
      const pass = 'pass',
        code = 'code';

      // Act
      const body = await client.disableTwoFactorAuth(pass, code);

      // Assert
      expect(callStub).toHaveBeenCalledWith('/auth/tfa', headers, {
        pass: pass,
        code: code,
      });
      expect(body).toEqual({});
    });
  });

  describe('-> store twoFactorAuth key', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeadersWithToken();
      const backupKey = 'key',
        code = 'code';

      // Act
      const body = await client.storeTwoFactorAuthKey(backupKey, code);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        '/auth/tfa',
        {
          key: backupKey,
          code: code,
        },
        headers,
      );
      expect(body).toEqual({});
    });
  });

  describe('-> send email to deactivate account', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const email = 'my@email';

      // Act
      const body = await client.sendDeactivationEmail(email);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`/deactivate/${email}`, headers);
      expect(body).toEqual({});
    });
  });

  describe('-> confirm account deactivation', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';

      // Act
      const body = await client.confirmDeactivation(token);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`/confirmDeactivation/${token}`, headers);
      expect(body).toEqual({});
    });
  });

  describe('-> send email unblock account', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const email = 'email@gmail.com';

      // Act
      const body = await client.requestUnblockAccount(email);

      // Assert
      expect(callStub).toHaveBeenCalledWith('users/unblock-account', { email }, headers);
      expect(body).toEqual({});
    });
  });

  describe('-> unblock account', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';

      // Act
      const body = await client.unblockAccount(token);

      // Assert
      expect(callStub).toHaveBeenCalledWith('users/unblock-account', { token }, headers);
      expect(body).toEqual({});
    });
  });

  describe('-> change password with link', () => {
    it('Should call with right params without private keys', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';
      const password = 'newPassword';
      const salt = 'newSalt';
      const mnemonic = 'newMnemonic';

      await client.changePasswordWithLink(token, password, salt, mnemonic);

      expect(callStub).toHaveBeenCalledWith(
        `/users/recover-account?token=${token}&reset=false`,
        {
          password,
          salt,
          mnemonic,
        },
        headers,
      );
    });

    it('Should call with right params including private keys', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';
      const password = 'newPassword';
      const salt = 'newSalt';
      const mnemonic = 'newMnemonic';
      const privateKeys = {
        ecc: 'newEccKey',
        kyber: 'newKyberKey',
      };

      await client.changePasswordWithLink(token, password, salt, mnemonic, privateKeys);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `/users/recover-account?token=${token}&reset=false`,
        {
          password,
          salt,
          mnemonic,
          privateKeys,
        },
        headers,
      );
    });
  });
  describe('-> change password with link v2', () => {
    it('Should call with right params without keys', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';
      const password = 'newPassword';
      const salt = 'newSalt';
      const mnemonic = 'newMnemonic';

      await client.changePasswordWithLinkV2(token, password, salt, mnemonic);

      expect(callStub).toHaveBeenCalledWith(
        `/users/recover-account-v2?token=${token}&reset=false`,
        {
          password,
          salt,
          mnemonic,
        },
        headers,
      );
    });

    it('Should call with right params including private keys', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';
      const password = 'newPassword';
      const salt = 'newSalt';
      const mnemonic = 'newMnemonic';
      const privateKeys = {
        ecc: 'newEccKey',
        kyber: 'newKyberKey',
      };

      await client.changePasswordWithLinkV2(token, password, salt, mnemonic, { private: privateKeys });

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `/users/recover-account-v2?token=${token}&reset=false`,
        {
          password,
          salt,
          mnemonic,
          privateKeys,
          publicKeys: undefined,
        },
        headers,
      );
    });

    it('Should call with right params including private and public keys', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';
      const password = 'newPassword';
      const salt = 'newSalt';
      const mnemonic = 'newMnemonic';
      const privateKeys = {
        ecc: 'newEccPrivateKey',
        kyber: 'newKyberPrivateKey',
      };
      const publicKeys = {
        ecc: 'eccPublicKey',
        kyber: 'kyberPublicKey',
      };

      await client.changePasswordWithLinkV2(token, password, salt, mnemonic, {
        private: privateKeys,
        public: publicKeys,
      });

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `/users/recover-account-v2?token=${token}&reset=false`,
        {
          password,
          salt,
          mnemonic,
          privateKeys,
          publicKeys,
        },
        headers,
      );
    });

    it('Should call with right params including only public keys (legacy backup without private keys)', async () => {
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();
      const token = 'token';
      const password = 'newPassword';
      const salt = 'newSalt';
      const mnemonic = 'newMnemonic';
      const publicKeys = {
        ecc: 'eccPublicKey',
        kyber: 'kyberPublicKey',
      };

      await client.changePasswordWithLinkV2(token, password, salt, mnemonic, {
        public: publicKeys,
      });

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        `/users/recover-account-v2?token=${token}&reset=false`,
        {
          password,
          salt,
          mnemonic,
          privateKeys: undefined,
          publicKeys,
        },
        headers,
      );
    });
  });
  describe('Legacy recover account', () => {
    it('Should call with right params & return values', async () => {
      // Arrange
      const callStub = vi.spyOn(HttpClient.prototype, 'put').mockResolvedValue({});
      const { client, headers } = clientAndHeaders();

      const payload = {
        token: 'recovery-token',
        encryptedPassword: 'encrypted-password',
        encryptedSalt: 'encrypted-salt',
        encryptedMnemonic: 'encrypted-mnemonic',
        eccEncryptedMnemonic: 'ecc-encrypted-mnemonic',
        kyberEncryptedMnemonic: 'kyber-encrypted-mnemonic',
        keys: {
          ecc: {
            public: 'ecc-public-key',
            private: 'ecc-private-key',
            revocationKey: 'ecc-revocation-key',
          },
          kyber: {
            public: 'kyber-public-key',
            private: 'kyber-private-key',
          },
        },
      };

      // Act
      const result = await client.legacyRecoverAccount(payload);

      // Assert
      expect(callStub).toHaveBeenCalledWith(
        '/users/legacy-recover-account',
        {
          token: payload.token,
          password: payload.encryptedPassword,
          salt: payload.encryptedSalt,
          mnemonic: payload.encryptedMnemonic,
          asymmetricEncryptedMnemonic: {
            ecc: payload.eccEncryptedMnemonic,
            hybrid: payload.kyberEncryptedMnemonic,
          },
          keys: payload.keys,
        },
        headers,
      );
      expect(result).toEqual({});
    });
  });
});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
): {
  client: Auth;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const client = Auth.client(apiUrl, appDetails);
  const headers = basicHeaders({ clientName, clientVersion });
  return { client, headers };
}

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
): {
  client: Auth;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Auth.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}
