import axios, { AxiosStatic } from 'axios';
import { Token, CryptoProvider, Keys, LoginDetails, RegisterDetails, UserAccessError } from './types';
import { UserSettings, UUID } from '../shared/types/userSettings';
import { TeamsSettings } from '../shared/types/teams';
import { basicHeaders, headersWithToken } from '../shared/headers';
import { ApiPublicConnectionDetails } from '../shared/types/apiConnection';
import { AppModule } from '../shared/modules';

export * from './types';

export class Auth extends AppModule {
  private readonly apiDetails: ApiPublicConnectionDetails;

  public static client(apiDetails: ApiPublicConnectionDetails) {
    return new Auth(axios, apiDetails);
  }

  constructor(axios: AxiosStatic, apiDetails: ApiPublicConnectionDetails) {
    super(axios);
    this.apiDetails = apiDetails;
  }

  public register(registerDetails: RegisterDetails): Promise<{
    token: Token,
    user: Omit<UserSettings, 'bucket'> & { referralCode: string },
    uuid: UUID
  }> {
    return this.axios
      .post(`${this.apiDetails.url}/api/register`, {
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
        headers: this.basicHeaders(),
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
      .post(`${this.apiDetails.url}/api/login`, {
        email: details.email
      }, {
        headers: this.basicHeaders(),
      })
      .then(response => {
        return response.data;
      });

    const encryptedSalt = loginResponse.sKey;
    const encryptedPasswordHash = cryptoProvider.encryptPasswordHash(details.password, encryptedSalt);
    const keys = await cryptoProvider.generateKeys(details.password);

    return this.axios
      .post(`${this.apiDetails.url}/api/access`, {
        email: details.email,
        password: encryptedPasswordHash,
        tfa: details.tfaCode,
        privateKey: keys.privateKeyEncrypted,
        publicKey: keys.publicKey,
        revocateKey: keys.revocationCertificate,
      }, {
        headers: this.basicHeaders(),
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
      .patch(`${this.apiDetails.url}/api/user/keys`, {
        publicKey: keys.publicKey,
        privateKey: keys.privateKeyEncrypted,
        revocationKey: keys.revocationCertificate,
      }, {
        headers: this.headersWithToken(token),
      })
      .then(response => {
        return response.data;
      });
  }

  private basicHeaders() {
    return basicHeaders(this.apiDetails.clientName, this.apiDetails.clientVersion);
  }

  private headersWithToken(token: Token) {
    return headersWithToken(this.apiDetails.clientName, this.apiDetails.clientVersion, token);
  }

}
