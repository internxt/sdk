import {Auth} from '../../src/auth';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const axiosMock = new MockAdapter(axios);

describe('# auth service tests', () => {

    afterEach(() => {
        axiosMock.reset();
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

        await expect(call).resolves.toEqual({
            valid: true
        });
    });

});