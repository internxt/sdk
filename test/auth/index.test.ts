import {Auth, CryptoProvider, Keys, LoginDetails, Password, RegisterDetails} from '../../src';
import axios from 'axios';
import sinon from 'sinon';
import {emptyRegisterDetails} from './registerDetails.mother';

describe('# auth service tests', () => {

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

      const postCall = sinon.stub(axios, 'post').resolves({
        status: 200
      });
      const authClient = new Auth(axios, 'apiUrl', 'client-test-name', '0.1');

      // Act
      await authClient.register(registerDetails);

      // Assert
      expect(postCall.firstCall.args).toEqual([
        'apiUrl/api/register',
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
        },
        {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'internxt-version': '0.1',
            'internxt-client': 'client-test-name',
          },
        }
      ]);
    });

    it('Should return error on network error', async () => {
      // Arrange
      const error = new Error('Network error');
      sinon.stub(axios, 'post').rejects(error);
      const authClient = new Auth(axios, '', '', '');
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const call = authClient.register(registerDetails);

      // Assert
      await expect(call).rejects.toEqual(error);
    });

    it('Should resolve valid on valid response', async () => {
      // Arrange
      sinon.stub(axios, 'post').resolves({
        status: 200,
        data: {
          valid: true
        }
      });
      const authClient = new Auth(axios, '', '', '');
      const registerDetails: RegisterDetails = emptyRegisterDetails();

      // Act
      const body = await authClient.register(registerDetails);

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
      sinon.stub(axios, 'post').rejects(error);
      const authClient = new Auth(axios, '', '', '');
      const loginDetails: LoginDetails = {
        email: '',
        password: '',
        tfaCode: undefined
      };
      const cryptoProvider: CryptoProvider = {
        encryptPassword: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: ''
          };
          return keys;
        }
      };

      // Act
      const call = authClient.login(loginDetails, cryptoProvider);

      // Assert
      await expect(call).rejects.toEqual(error);
    });

    it('Should bubble up the error on second call failure', async () => {
      // Arrange
      const error = new Error('Network error');
      const authClient = new Auth(axios, '', '', '');
      const loginDetails: LoginDetails = {
        email: '',
        password: '',
        tfaCode: undefined
      };
      const cryptoProvider: CryptoProvider = {
        encryptPassword: () => '',
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: '',
            publicKey: '',
            revocationCertificate: ''
          };
          return keys;
        }
      };
      const postStub = sinon.stub(axios, 'post');
      postStub
        .onFirstCall()
        .resolves({
          data: {
            sKey: 'encrypted_salt'
          }
        })
        .onSecondCall()
        .rejects(error);

      // Act
      const call = authClient.login(loginDetails, cryptoProvider);

      // Assert
      await expect(call).rejects.toEqual(error);
    });

    it('Should call access with correct parameters', async () => {
      // Arrange
      const authClient = new Auth(axios, '', '', '');
      const loginDetails: LoginDetails = {
        email: 'my_email',
        password: 'password',
        tfaCode: undefined
      };
      const cryptoProvider: CryptoProvider = {
        encryptPassword: (password, encryptedSalt) => password + '-' + encryptedSalt,
        generateKeys: (password: Password) => {
          const keys: Keys = {
            privateKeyEncrypted: 'priv',
            publicKey: 'pub',
            revocationCertificate: 'rev'
          };
          return keys;
        }
      };
      const config = {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'internxt-version': '',
          'internxt-client': '',
        },
      };
      const postStub = sinon.stub(axios, 'post');
      postStub
        .onFirstCall()
        .resolves({
          data: {
            sKey: 'encrypted_salt'
          }
        })
        .onSecondCall()
        .resolves({
          data: {
            user: 'user'
          }
        });

      // Act
      const body = await authClient.login(loginDetails, cryptoProvider);

      // Assert
      expect(postStub.firstCall.args).toEqual([
        '/api/login',
        {
          email: loginDetails.email
        },
        config
      ]);
      expect(postStub.secondCall.args).toEqual([
        '/api/access',
        {
          email: loginDetails.email,
          password: 'password-encrypted_salt',
          tfa: loginDetails.tfaCode,
          privateKey: 'priv',
          publicKey: 'pub',
          revocateKey: 'rev',
        },
        config
      ]);
      expect(body).toEqual({
        user: 'user'
      });
    });

  });

});