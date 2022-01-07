import axios, { AxiosStatic } from 'axios';
import { Token, CryptoProvider, Keys, LoginDetails, RegisterDetails, UserAccessError } from './types';
import { UserSettings, UUID } from '../shared/types/userSettings';
import { TeamsSettings } from '../shared/types/teams';
import { basicHeaders, headersWithToken } from '../shared/headers';
import { AppModule } from '../shared/modules';

export * from './types';

export class Auth extends AppModule {
  private readonly apiUrl: string;
  private readonly clientName: string;
  private readonly clientVersion: string;

  public static client(apiUrl: string, clientName: string, clientVersion: string) {
    return new Auth(axios, apiUrl, clientName, clientVersion);
  }

  constructor(axios: AxiosStatic, apiUrl: string, clientName: string, clientVersion: string) {
    super(axios);
    this.apiUrl = apiUrl;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
  }

  public register(registerDetails: RegisterDetails): Promise<{
    token: Token,
    user: Omit<UserSettings, 'bucket'> & { referralCode: string },
    uuid: UUID
  }> {
    return this.axios
      .post(`${this.apiUrl}/api/register`, {
        name: registerDetails.name,
        captcha: registerDetails.captcha,
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
        headers: basicHeaders(this.clientName, this.clientVersion),
      })
      .then(response => {
        return response.data;
      });
  }

  public async login(details: LoginDetails, cryptoProvider: CryptoProvider): Promise<{
    token: Token;
    user: UserSettings;
    userTeam: TeamsSettings | null
  }> {
    const loginResponse = await this.axios
      .post(`${this.apiUrl}/api/login`, {
        email: details.email
      }, {
        headers: basicHeaders(this.clientName, this.clientVersion),
      })
      .then(response => {
        return response.data;
      });

    const encryptedSalt = loginResponse.sKey;
    const encryptedPasswordHash = cryptoProvider.encryptPasswordHash(details.password, encryptedSalt);
    const keys = await cryptoProvider.generateKeys(details.password);

    return this.axios
      .post(`${this.apiUrl}/api/access`, {
        email: details.email,
        password: encryptedPasswordHash,
        tfa: details.tfaCode,
        privateKey: keys.privateKeyEncrypted,
        publicKey: keys.publicKey,
        revocateKey: keys.revocationCertificate,
      }, {
        headers: basicHeaders(this.clientName, this.clientVersion),
      })
      .then(response => {
        const data = response.data;
        data.user.revocationKey = data.user.revocateKey; // TODO : remove when all projects use SDK
        return data;
      })
      .catch(error => {
        throw new UserAccessError(error.message);
      });
  }

  public updateKeys(keys: Keys, token: Token) {
    return this.axios
      .patch(`${this.apiUrl}/api/user/keys`, {
        publicKey: keys.publicKey,
        privateKey: keys.privateKeyEncrypted,
        revocationKey: keys.revocationCertificate,
      }, {
        headers: headersWithToken(this.clientName, this.clientVersion, token),
      })
      .then(response => {
        return response.data;
      });
  }

}
