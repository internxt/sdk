import axios, {AxiosStatic} from 'axios';
import {extractAxiosErrorMessage} from '../utils';
import {CryptoProvider, LoginDetails, RegisterDetails} from './types';
import {UserSettings} from '../shared/types/userSettings';
import {TeamsSettings} from '../shared/types/teams';

export * from './types';

export class Auth {
  private axios: AxiosStatic;
  private readonly apiUrl: string;
  private readonly clientName: string;
  private readonly clientVersion: string;

  public static client(apiUrl: string, clientName: string, clientVersion: string) {
    return new Auth(axios, apiUrl, clientName, clientVersion);
  }

  constructor(axios: AxiosStatic, apiUrl: string, clientName: string, clientVersion: string) {
    this.axios = axios;
    this.apiUrl = apiUrl;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
  }

  public register(registerDetails: RegisterDetails): Promise<{
    token: unknown,
    user: unknown,
    uuid: unknown
  }> {
    return this.axios
      .post(`${this.apiUrl}/api/register`, {
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
      }, {
        headers: this.headers(),
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        throw new Error(extractAxiosErrorMessage(error));
      });
  }

  public async login(details: LoginDetails, cryptoProvider: CryptoProvider): Promise<{
    data: {
      token: string;
      user: UserSettings;
      userTeam: TeamsSettings | null
    }
  }> {
    const loginResponse = await this.axios
      .post(`${this.apiUrl}/api/login`, {
        email: details.email
      }, {
        headers: this.headers(),
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        throw new Error(extractAxiosErrorMessage(error));
      });

    const encryptedSalt = loginResponse.sKey;
    const encryptedPassword = cryptoProvider.encryptPassword(details.password, encryptedSalt);
    const keys = cryptoProvider.generateKeys(details.password);

    return this.axios
      .post(`${this.apiUrl}/api/access`, {
        email: details.email,
        password: encryptedPassword,
        tfa: details.tfaCode,
        privateKey: keys.privateKeyEncrypted,
        publicKey: keys.publicKey,
        revocateKey: keys.revocationCertificate,
      }, {
        headers: this.headers(),
      })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        throw new Error(extractAxiosErrorMessage(error));
      });
  }

  private headers() {
    return {
      'content-type': 'application/json; charset=utf-8',
      'internxt-version': this.clientVersion,
      'internxt-client': this.clientName
    };
  }
}
