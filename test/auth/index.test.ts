import { Auth, CryptoProvider, Keys, LoginDetails, Password, RegisterDetails, Token } from '../../src';
import axios from 'axios';
import sinon from 'sinon';
import { emptyRegisterDetails } from './registerDetails.mother';
import { validResponse } from '../shared/response';
import { testBasicHeaders, testHeadersWithToken } from '../shared/headers';
import { ApiSecurity, AppDetails } from '../../src/shared';

const myAxios = axios.create();

describe('# auth service tests', () => {

  beforeEach(() => {
    sinon.stub(axios, 'create').returns(myAxios);
  });

  afterEach(() => {
    sinon.restore();
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
      registerDetails.keys.privateKeyEncrypted = '7';
      registerDetails.keys.publicKey = '8';
      registerDetails.keys.revocationCertificate = '9';
      registerDetails.captcha = '10';

      const postCall = sinon.stub(myAxios, 'post').resolves(validResponse({}));
      const { client, headers } = clientAndHeaders();

      // Act
      await client.register(registerDetails);

      // Assert
      expect(postCall.firstCall.args).toEqual([
        '/register',
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
          referral: registerDetails.referral,
          referrer: registerDetails.referrer,
          captcha: registerDetails.captcha
        },
        {
          headers: headers,
        }
      ]);
    });

    it('Should return error on network error', async () => {
      // Arrange
      const error = new Error('Network error');
      sinon.stub(myAxios, 'post').rejects(error);
      const { client } = clientAndHeaders();
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const call = client.register(registerDetails);

      // Assert
      await expect(call).rejects.toEqual(error);
    });

    it('Should resolve valid on valid response', async () => {
      // Arrange
      sinon.stub(myAxios, 'post').resolves(
        validResponse({
          valid: true
        })
      );
      const { client } = clientAndHeaders();
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const body = await client.register(registerDetails);

      // Assert
      expect(body).toEqual({
        valid: true
      });
    });

  });

  describe('-> login use case', () => {

    it('Should bubble up the error on first call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      sinon.stub(myAxios, 'post').rejects(error);
      const { client } = clientAndHeaders();
      const loginDetails: LoginDetails = {
        email: '',
        password: '',
        tfaCode: undefined
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: ''
          };
          return Promise.resolve(keys);
        }
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
        tfaCode: undefined
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: ''
          };
          return Promise.resolve(keys);
        }
      };
      const postStub = sinon.stub(myAxios, 'post');
      postStub
        .onFirstCall()
        .resolves(
          validResponse({
            sKey: 'encrypted_salt'
          })
        )
        .onSecondCall()
        .rejects(error);

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
        tfaCode: undefined
      };
      const cryptoProvider: CryptoProvider = {
        encryptPasswordHash: (password, encryptedSalt) => password + '-' + encryptedSalt,
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: 'priv',
            publicKey: 'pub',
            revocationCertificate: 'rev'
          };
          return Promise.resolve(keys);
        }
      };
      const postStub = sinon.stub(myAxios, 'post');
      postStub
        .onFirstCall()
        .resolves(
          validResponse({
            sKey: 'encrypted_salt'
          })
        )
        .onSecondCall()
        .resolves(
          validResponse({
            user: {
              revocateKey: 'key'
            }
          })
        );

      // Act
      const body = await client.login(loginDetails, cryptoProvider);

      // Assert
      expect(postStub.firstCall.args).toEqual([
        '/login',
        {
          email: loginDetails.email
        },
        {
          headers: headers,
        }
      ]);
      expect(postStub.secondCall.args).toEqual([
        '/access',
        {
          email: loginDetails.email,
          password: 'password-encrypted_salt',
          tfa: loginDetails.tfaCode,
          privateKey: 'priv',
          publicKey: 'pub',
          revocateKey: 'rev',
        },
        {
          headers: headers,
        }
      ]);
      expect(body).toEqual({
        user: {
          revocateKey: 'key',
          revocationKey: 'key',
        }
      });
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
        revocationCertificate: 'crt'
      };
      const axiosStub = sinon.stub(myAxios, 'patch').resolves(validResponse({}));

      // Act
      await client.updateKeys(keys, token);

      // Assert
      expect(axiosStub.firstCall.args).toEqual([
        '/user/keys',
        {
          publicKey: 'pubk',
          privateKey: 'prik',
          revocationKey: 'crt',
        },
        {
          headers: headers
        }
      ]);
    });
  });

  describe('-> security details', () => {

    it('Should bubble up the error on first call failure', async () => {
      // Arrange
      sinon.stub(myAxios, 'post').rejects(new Error('Network error'));
      const { client } = clientAndHeaders();
      const email = '';

      // Act
      const call = client.securityDetails(email);

      // Assert
      await expect(call).rejects.toThrowError('Network error');
    });

    it('Should call with right parameters & return correct content', async () => {
      // Arrange
      const postStub = sinon.stub(myAxios, 'post').resolves(validResponse({
        hasKeys: true,
        sKey: 'gibberish',
        tfa: true
      }));
      const { client, headers } = clientAndHeaders();
      const email = 'my@email.com';

      // Act
      const body = await client.securityDetails(email);

      // Assert
      expect(postStub.firstCall.args).toEqual([
        '/login',
        {
          email: email
        },
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        encryptedSalt: 'gibberish',
        tfaEnabled: true
      });
    });

    it('Should return boolean value on null param response', async () => {
      // Arrange
      sinon.stub(myAxios, 'post').resolves(validResponse({
        hasKeys: true,
        sKey: 'gibberish',
        tfa: null
      }));
      const { client } = clientAndHeaders();
      const email = 'my@email.com';

      // Act
      const body = await client.securityDetails(email);

      // Assert
      expect(body).toEqual({
        encryptedSalt: 'gibberish',
        tfaEnabled: false
      });
    });

  });

  describe('-> generate twoFactorAuth code', () => {

    it('Should bubble up the error on first call failure', async () => {
      // Arrange
      sinon.stub(myAxios, 'get').rejects(new Error('Network error'));
      const { client } = clientAndHeadersWithToken();

      // Act
      const call = client.generateTwoFactorAuthQR();

      // Assert
      await expect(call).rejects.toThrowError('Network error');
    });

    it('Should call with right params & return data', async () => {
      // Arrange
      const callStub = sinon.stub(myAxios, 'get').resolves(validResponse({
        code: 'code'
      }));
      const { client, headers } = clientAndHeadersWithToken();

      // Act
      const body = await client.generateTwoFactorAuthQR();

      // Assert
      await expect(callStub.firstCall.args).toEqual([
        '/tfa',
        {
          headers: headers
        }
      ]);
      expect(body).toEqual({
        code: 'code'
      });
    });

  });

});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
): {
  client: Auth,
  headers: object
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const client = Auth.client(apiUrl, appDetails);
  const headers = testBasicHeaders(clientName, clientVersion);
  return { client, headers };
}

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token'
): {
  client: Auth,
  headers: object
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
    mnemonic: '',
  };
  const client = Auth.client(apiUrl, appDetails, apiSecurity);
  const headers = testHeadersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
