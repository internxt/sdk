import { Axios } from 'axios';
import {
  Token,
  CryptoProvider,
  Keys,
  LoginDetails,
  RegisterDetails,
  UserAccessError,
  SecurityDetails,
  TwoFactorAuthQR
} from './types';
import { UserSettings, UUID } from '../shared/types/userSettings';
import { TeamsSettings } from '../shared/types/teams';
import { basicHeaders, headersWithToken } from '../shared/headers';
import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { ApiModule } from '../shared/modules';
import { getDriveAxiosClient } from '../drive/shared/axios';

export * from './types';

export class Auth extends ApiModule {
  private readonly appDetails: AppDetails;
  private readonly apiSecurity?: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    const axios = getDriveAxiosClient(apiUrl);
    return new Auth(axios, appDetails, apiSecurity);
  }

  private constructor(axios: Axios, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    super(axios);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Tries to register a new user
   * @param registerDetails
   */
  public register(registerDetails: RegisterDetails): Promise<{
    token: Token,
    user: Omit<UserSettings, 'bucket'> & { referralCode: string },
    uuid: UUID
  }> {
    return this.axios
      .post('/register', {
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

  /**
   * Tries to log in a user given its login details
   * @param details
   * @param cryptoProvider
   */
  public async login(details: LoginDetails, cryptoProvider: CryptoProvider): Promise<{
    token: Token;
    user: UserSettings;
    userTeam: TeamsSettings | null
  }> {
    const securityDetails = await this.securityDetails(details.email);
    const encryptedSalt = securityDetails.encryptedSalt;
    const encryptedPasswordHash = cryptoProvider.encryptPasswordHash(details.password, encryptedSalt);
    const keys = await cryptoProvider.generateKeys(details.password);

    return this.axios
      .post('/access', {
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

  /**
   * Updates the asymmetric keys
   * @param keys
   * @param token
   */
  public updateKeys(keys: Keys, token: Token) {
    return this.axios
      .patch('/user/keys', {
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

  /**
   * Returns general security details
   * @param email
   */
  public securityDetails(email: string): Promise<SecurityDetails> {
    return this.axios
      .post('/login', {
        email: email
      }, {
        headers: this.basicHeaders()
      })
      .then(response => {
        return {
          encryptedSalt: response.data.sKey,
          tfaEnabled: response.data.tfa === true,
        };
      });
  }

  /**
   * Generates a new TwoFactorAuth code
   */
  public generateTwoFactorAuthQR(): Promise<TwoFactorAuthQR> {
    return this.axios
      .get('/tfa', {
        headers: this.headersWithToken(<string>this.apiSecurity?.token),
      })
      .then(response => {
        return {
          qr: response.data.qr,
          backupKey: response.data.code,
        };
      });
  }

  /**
   * Disables TwoFactorAuthentication
   * @param pass
   * @param code
   */
  public disableTwoFactorAuth(pass: string, code: string): Promise<void> {
    return this.axios
      .delete('/tfa', {
        data: {
          pass: pass,
          code: code
        },
        headers: this.headersWithToken(<string>this.apiSecurity?.token),
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Store TwoFactorAuthentication details
   * @param backupKey
   * @param code
   */
  public storeTwoFactorAuthKey(backupKey: string, code: string): Promise<void> {
    return this.axios
      .put('/tfa', {
        key: backupKey,
        code: code,
      }, {
        headers: this.headersWithToken(<string>this.apiSecurity?.token),
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Sends request to send the email to delete the account
   * @param email
   */
  public sendDeactivationEmail(email: string): Promise<void> {
    return this.axios
      .get(`/deactivate/${email}`, {
        headers: this.basicHeaders()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Confirms the account deactivation
   * @param token
   */
  public confirmDeactivation(token: string): Promise<void> {
    return this.axios
      .get(`/confirmDeactivation/${token}`, {
        headers: this.basicHeaders()
      })
      .then(response => {
        return response.data;
      });
  }

  private basicHeaders() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }

  private headersWithToken(token: Token) {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, token);
  }

}
