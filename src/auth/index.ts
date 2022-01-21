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
import { HttpClient } from '../shared/http/client';

export * from './types';

export class Auth {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity?: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    return new Auth(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    this.client = HttpClient.create(apiUrl);
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
    return this.client
      .post(
        '/register',
        {
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
        },
        this.basicHeaders(),
      );
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

    return this.client
      .post<{
        token: Token;
        user: UserSettings;
        userTeam: TeamsSettings | null
      }>(
        '/access',
        {
          email: details.email,
          password: encryptedPasswordHash,
          tfa: details.tfaCode,
          privateKey: keys.privateKeyEncrypted,
          publicKey: keys.publicKey,
          revocateKey: keys.revocationCertificate,
        },
        this.basicHeaders()
      )
      .then(data => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    return this.client
      .patch(
        '/user/keys',
        {
          publicKey: keys.publicKey,
          privateKey: keys.privateKeyEncrypted,
          revocationKey: keys.revocationCertificate,
        },
        this.headersWithToken(token)
      );
  }

  /**
   * Returns general security details
   * @param email
   */
  public securityDetails(email: string): Promise<SecurityDetails> {
    return this.client
      .post<{
        sKey: string
        tfa: boolean | null
      }>(
        '/login',
        {
          email: email
        },
        this.basicHeaders()
      )
      .then(data => {
        return {
          encryptedSalt: data.sKey,
          tfaEnabled: data.tfa === true,
        };
      });
  }

  /**
   * Generates a new TwoFactorAuth code
   */
  public generateTwoFactorAuthQR(): Promise<TwoFactorAuthQR> {
    return this.client
      .get<{
        qr: string
        code: string
      }>(
        '/tfa',
        this.headersWithToken(<string>this.apiSecurity?.token),
      )
      .then(data => {
        return {
          qr: data.qr,
          backupKey: data.code,
        };
      });
  }

  /**
   * Disables TwoFactorAuthentication
   * @param pass
   * @param code
   */
  public disableTwoFactorAuth(pass: string, code: string): Promise<void> {
    return this.client
      .delete(
        '/tfa',
        this.headersWithToken(<string>this.apiSecurity?.token),
        {
          pass: pass,
          code: code
        }
      );
  }

  /**
   * Store TwoFactorAuthentication details
   * @param backupKey
   * @param code
   */
  public storeTwoFactorAuthKey(backupKey: string, code: string): Promise<void> {
    return this.client
      .put(
        '/tfa',
        {
          key: backupKey,
          code: code,
        },
        this.headersWithToken(<string>this.apiSecurity?.token)
      );
  }

  /**
   * Sends request to send the email to delete the account
   * @param email
   */
  public sendDeactivationEmail(email: string): Promise<void> {
    return this.client
      .get(
        `/deactivate/${email}`,
        this.basicHeaders()
      );
  }

  /**
   * Confirms the account deactivation
   * @param token
   */
  public confirmDeactivation(token: string): Promise<void> {
    return this.client
      .get(
        `/confirmDeactivation/${token}`,
        this.basicHeaders()
      );
  }

  private basicHeaders() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }

  private headersWithToken(token: Token) {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, token);
  }

}
