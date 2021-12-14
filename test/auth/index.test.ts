import {Auth} from '../../src/auth';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const axiosMock = new MockAdapter(axios);

describe('# auth service tests', () => {

    afterEach(() => {
        axiosMock.reset();
    });

    it('Should have all the correct params on call', async () => {

        const post = jest.spyOn(axios, 'post');

        axiosMock.onPost('apiUrl/api/register').reply(200, {
            valid: true
        });

        const authClient = new Auth(axios, 'apiUrl', 'client-test-name', '0.1');

        const name = '1';
        const lastname = '2';
        const email = '3';
        const password = '4';
        const mnemonic = '5';
        const salt = '6';
        const privateKey = '7';
        const publicKey = '8';
        const revocationKey = '9';

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

        expect(post).toBeCalledWith(
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
                    'internxt-client': 'client-test-name'
                },
            }
        );
    });

    it('Should return error on network error', async () => {

        axiosMock.onPost('/api/register').networkError();

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

        await expect(call).rejects.toThrowError();
    });

    it('Should resolve valid on valid response', async () => {

        axiosMock.onPost('/api/register').reply(200, {
            valid: true
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

        const call = await authClient.register(
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

        expect(call).toEqual({
            valid: true
        });
    });

});