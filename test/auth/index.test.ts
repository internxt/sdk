import {Auth, CryptoProvider, Keys, LoginDetails, Password} from '../../src/auth';
import axios from 'axios';
import sinon from 'sinon';

describe('# auth service tests', () => {

    describe('# register use case', () => {

        afterEach(() => {
            sinon.restore();
        });

        it('Should have all the correct params on call', async () => {
            const name = '1';
            const lastname = '2';
            const email = '3';
            const password = '4';
            const mnemonic = '5';
            const salt = '6';
            const privateKey = '7';
            const publicKey = '8';
            const revocationKey = '9';

            sinon.stub(axios, 'post')
                .withArgs(
                    'apiUrl/api/register',
                    {
                        name: name,
                        lastname: lastname,
                        email: email,
                        password: password,
                        mnemonic: mnemonic,
                        salt: salt,
                        privateKey: privateKey,
                        publicKey: publicKey,
                        revocationKey: revocationKey,
                        referral: undefined,
                        referrer: undefined,
                    },
                    {
                        headers: {
                            'content-type': 'application/json; charset=utf-8',
                            'internxt-version': '0.1',
                            'internxt-client': 'client-test-name',
                        },
                    }
                )
                .resolves({});

            const authClient = new Auth(axios, 'apiUrl', 'client-test-name', '0.1');

            await authClient.register(
                name,
                lastname,
                email,
                password,
                mnemonic,
                salt,
                privateKey,
                publicKey,
                revocationKey
            );
        });

        it('Should return error on network error', async () => {
            const error = new Error('Network error');
            sinon.stub(axios, 'post').rejects(error);
            const authClient = new Auth(axios, '', '', '');
            const name = '';
            const lastname = '';
            const email = '';
            const password = '';
            const mnemonic = '';
            const salt = '';
            const privateKey = '';
            const publicKey = '';
            const revocationKey = '';

            const call = authClient.register(
                name,
                lastname,
                email,
                password,
                mnemonic,
                salt,
                privateKey,
                publicKey,
                revocationKey
            );

            await expect(call).rejects.toEqual(error);
        });

        it('Should resolve valid on valid response', async () => {

            sinon.stub(axios, 'post').resolves({
                data: {
                    valid: true
                }
            });

            const authClient = new Auth(axios, '', '', '');

            const name = '';
            const lastname = '';
            const email = '';
            const password = '';
            const mnemonic = '';
            const salt = '';
            const privateKey = '';
            const publicKey = '';
            const revocationKey = '';

            const body = await authClient.register(
                name,
                lastname,
                email,
                password,
                mnemonic,
                salt,
                privateKey,
                publicKey,
                revocationKey
            );

            expect(body).toEqual({
                valid: true
            });
        });

    });

    describe('# login use case', () => {

        afterEach(() => {
            sinon.restore();
        });

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
                encryptPassword: () => {
                    return '';
                },
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

        it('Should call access with correct parameters', async () => {
            // Arrange
            const loginDetails: LoginDetails = {
                email: 'my_email',
                password: 'password',
                tfaCode: undefined
            };
            const config = {
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'internxt-version': '',
                    'internxt-client': '',
                },
            };
            const cryptoProvider: CryptoProvider = {
                encryptPassword: (password, encryptedSalt) => {
                    return password + '-' + encryptedSalt;
                },
                generateKeys: (password: Password) => {
                    const keys: Keys = {
                        privateKeyEncrypted: 'priv',
                        publicKey: 'pub',
                        revocationCertificate: 'rev'
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
                .resolves({});

            const authClient = new Auth(axios, '', '', '');

            // Act
            await authClient.login(loginDetails, cryptoProvider);

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
        });

    });
});