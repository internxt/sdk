import axios, {AxiosStatic} from 'axios';
import {extractAxiosErrorMessage} from '../utils';

export class Auth {
    private axios: AxiosStatic;
    private apiUrl: string;
    private clientName: string;
    private clientVersion: string;

    public static client(apiUrl: string, clientName: string, clientVersion: string) {
        return new Auth(axios, apiUrl, clientName, clientVersion);
    }

    constructor(axios: AxiosStatic, apiUrl: string, clientName: string, clientVersion: string) {
        this.axios = axios;
        this.apiUrl = apiUrl;
        this.clientName = clientName;
        this.clientVersion = clientVersion;
    }

    register(
        name: string,
        lastname: string,
        email: string,
        password: string,
        mnemonic: string,
        salt: string,
        privateKey: string,
        publicKey: string,
        revocationKey: string,
        referral?: string,
        referrer?: string,
    ) {
        return this.axios
            .post(`${this.apiUrl}/api/register`, {
                name: name,
                lastname: lastname,
                email: email,
                password: password,
                mnemonic: mnemonic,
                salt: salt,
                privateKey: privateKey,
                publicKey: publicKey,
                revocationKey: revocationKey,
                referral: referral,
                referrer: referrer,
            }, {
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'internxt-version': this.clientVersion,
                    'internxt-client': this.clientName
                },
            })
            .then(response => {
                return response.data;
            })
            .catch(error => {
                throw new Error(extractAxiosErrorMessage(error));
            });
    }

}