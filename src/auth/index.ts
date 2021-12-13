import axios from 'axios';
import {extractAxiosErrorMessage} from '../utils';

export class Auth {
    private apiUrl: string;
    private clientName: string;
    private clientVersion: string;

    public static client(apiUrl: string, clientName: string, clientVersion: string) {
        return new Auth(axios, apiUrl, clientName, clientVersion);
    }

    constructor(axios: object, apiUrl: string, clientName: string, clientVersion: string) {
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
        return axios
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