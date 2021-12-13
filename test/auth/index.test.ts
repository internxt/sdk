import {Auth} from '../../src/auth';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('# auth service tests', () => {

    it('Should return error on network error', async () => {
        const mock = new MockAdapter(axios);

        mock.onPost('/api/register').networkError();

        const authClient = new Auth(axios, '', '', '');

        const name = '';
        const lastname = '';
        const email = '';
        const password = '';
        const mnemonic = '';
        const salt = '';
        const privateKey = '';
        const publicKey = '';
        const revocationKet = '';

        const call = authClient.register(
            name,
            lastname,
            email,
            password,
            mnemonic,
            salt,
            privateKey,
            publicKey,
            revocationKet
        );

        await expect(call).rejects.toThrowError();
    });

});