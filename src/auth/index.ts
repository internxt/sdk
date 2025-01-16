import {
  Token,
  CryptoProvider,
  Keys,
  LoginDetails,
  RegisterDetails,
  SecurityDetails,
  TwoFactorAuthQR,
  RegisterPreCreatedUser,
  RegisterPreCreatedUserResponse,
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
  private readonly apiUrl: string;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    return new Auth(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity?.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
    this.apiUrl = apiUrl;
  }

  /**
   * Tries to register a new user
   * @param registerDetails
   */
  public register(registerDetails: RegisterDetails): Promise<{
    token: Token;
    user: Omit<UserSettings, 'bucket'> & { referralCode: string };
    uuid: UUID;
  }> {
    return this.client.post(
      '/users',
      {
        name: registerDetails.name,
        captcha: registerDetails.captcha,
        lastname: registerDetails.lastname,
        email: registerDetails.email,
        password: registerDetails.password,
        mnemonic: registerDetails.mnemonic,
        salt: registerDetails.salt,
        /**
        / @deprecated The individual fields for keys should not be used
        */
        privateKey: registerDetails.keys.privateKeyEncrypted,
        publicKey: registerDetails.keys.publicKey,
        revocationKey: registerDetails.keys.revocationCertificate,
        keys: {
          ecc: {
            publicKey: registerDetails.keys.ecc.publicKey,
            privateKeyEncrypted: registerDetails.keys.ecc.privateKeyEncrypted,
          },
          kyber: {
            publicKey: registerDetails.keys.kyber.publicKey,
            privateKeyEncrypted: registerDetails.keys.kyber.privateKeyEncrypted,
          },
        },
        referral: registerDetails.referral,
        referrer: registerDetails.referrer,
      },
      this.basicHeaders(),
    );
  }

  /**
   * Registers a precreated user
   * @param registerDetails
   * @returns {Promise<RegisterPreCreatedUserResponse>} Returns sign in token, user data and uuid.
   */
  public registerPreCreatedUser(registerDetails: RegisterPreCreatedUser): Promise<RegisterPreCreatedUserResponse> {
    return this.client.post(
      'users/pre-created-users/register',
      {
        name: registerDetails.name,
        captcha: registerDetails.captcha,
        lastname: registerDetails.lastname,
        email: registerDetails.email,
        password: registerDetails.password,
        mnemonic: registerDetails.mnemonic,
        salt: registerDetails.salt,
        /**
        / @deprecated The individual fields for keys should not be used
        */
        privateKey: registerDetails.keys.privateKeyEncrypted,
        publicKey: registerDetails.keys.publicKey,
        revocationKey: registerDetails.keys.revocationCertificate,
        keys: {
          ecc: {
            publicKey: registerDetails.keys.ecc.publicKey,
            privateKeyEncrypted: registerDetails.keys.ecc.privateKeyEncrypted,
          },
          kyber: {
            publicKey: registerDetails.keys.kyber.publicKey,
            privateKeyEncrypted: registerDetails.keys.kyber.privateKeyEncrypted,
          },
        },
        referral: registerDetails.referral,
        referrer: registerDetails.referrer,
        invitationId: registerDetails.invitationId,
      },
      this.basicHeaders(),
    );
  }

  /**
   * Requests account unblock email
   *
   * @param {string} email - The email address associated with the account.
   * @returns {Promise<void>} - Resolves when the email is sent.
   */
  public requestUnblockAccount(email: string): Promise<void> {
    return this.client.post(
      'users/unblock-account',
      {
        email,
      },
      this.basicHeaders(),
    );
  }

  /**
   * Unblocks account with token
   *
   * @param {string} token - The token received via email to verify and unblock the account.
   * @returns {Promise<void>} - Resolves successfuly when account is unblocked
   */
  public unblockAccount(token: string): Promise<void> {
    return this.client.put('users/unblock-account', { token }, this.basicHeaders());
  }

  /**
   * Tries to log in a user given its login details
   * @param details
   * @param cryptoProvider
   */
  public async login(
    details: LoginDetails,
    cryptoProvider: CryptoProvider,
  ): Promise<{
    token: Token;
    newToken: Token;
    user: UserSettings;
    userTeam: TeamsSettings | null;
  }> {
    const securityDetails = await this.securityDetails(details.email);
    const encryptedSalt = securityDetails.encryptedSalt;
    const encryptedPasswordHash = cryptoProvider.encryptPasswordHash(details.password, encryptedSalt);
    const keys = await cryptoProvider.generateKeys(details.password);

    return this.client
      .post<{
        token: Token;
        newToken: Token;
        user: UserSettings;
        userTeam: TeamsSettings | null;
      }>(
        '/auth/login/access',
        {
          email: details.email,
          password: encryptedPasswordHash,
          tfa: details.tfaCode,
          /**
          / @deprecated The individual fields for keys should not be used
          */
          privateKey: keys.privateKeyEncrypted,
          publicKey: keys.publicKey,
          revocateKey: keys.revocationCertificate,
          keys: {
            ecc: {
              publicKey: keys.ecc.publicKey,
              privateKeyEncrypted: keys.ecc.privateKeyEncrypted,
            },
            kyber: {
              publicKey: keys.kyber.publicKey,
              privateKeyEncrypted: keys.kyber.privateKeyEncrypted,
            },
          },
        },
        this.basicHeaders(),
      )
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data.user.revocationKey = data.user.revocateKey; // TODO : remove when all projects use SDK
        return data;
      });
  }

  /**
   * Updates the asymmetric keys
   * @param keys
   * @param token
   */
  public updateKeys(keys: Keys, token: Token) {
    return this.client.patch(
      '/user/keys',
      {
        /**
        / @deprecated The individual fields for keys should not be used
        */
        publicKey: keys.publicKey,
        privateKey: keys.privateKeyEncrypted,
        revocationKey: keys.revocationCertificate,
        ecc: {
          publicKey: keys.ecc.publicKey,
          privateKeyEncrypted: keys.ecc.privateKeyEncrypted,
        },
        kyber: {
          publicKey: keys.kyber.publicKey,
          privateKeyEncrypted: keys.kyber.privateKeyEncrypted,
        },
      },
      this.headersWithToken(token),
    );
  }

  /**
   * Returns general security details
   * @param email
   */
  public securityDetails(email: string): Promise<SecurityDetails> {
    return this.client
      .post<{
        sKey: string;
        tfa: boolean | null;
      }>(
        '/auth/login',
        {
          email: email,
        },
        this.basicHeaders(),
      )
      .then((data) => {
        return {
          encryptedSalt: data.sKey,
          tfaEnabled: data.tfa === true,
        };
      });
  }

  /**
   * Logout
   */
  public logout(token?: Token): Promise<void> {
    return this.client.get('/auth/logout', this.headersWithToken(token ?? <string>this.apiSecurity?.token));
  }

  /**
   * Generates a new TwoFactorAuth code
   */
  public generateTwoFactorAuthQR(token?: Token): Promise<TwoFactorAuthQR> {
    return this.client
      .get<{
        qr: string;
        code: string;
      }>('/auth/tfa', this.headersWithToken(token ?? <string>this.apiSecurity?.token))
      .then((data) => {
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
  public disableTwoFactorAuth(pass: string, code: string, token?: Token): Promise<void> {
    return this.client.delete('/auth/tfa', this.headersWithToken(token ?? <string>this.apiSecurity?.token), {
      pass: pass,
      code: code,
    });
  }

  /**
   * Store TwoFactorAuthentication details
   * @param backupKey
   * @param code
   */
  public storeTwoFactorAuthKey(backupKey: string, code: string, token?: Token): Promise<void> {
    return this.client.put(
      '/auth/tfa',
      {
        key: backupKey,
        code: code,
      },
      this.headersWithToken(token ?? <string>this.apiSecurity?.token),
    );
  }

  /**
   * Sends request to send the email to delete the account
   * @param email
   */
  public sendDeactivationEmail(email: string): Promise<void> {
    return this.client.get(`/deactivate/${email}`, this.basicHeaders());
  }

  /**
   * Confirms the account deactivation
   * @param token
   */
  public confirmDeactivation(token: string): Promise<void> {
    return this.client.get(`/confirmDeactivation/${token}`, this.basicHeaders());
  }

  /**
   * Check credentials
   * @param hashedPassword
   * @returns
   */

  public areCredentialsCorrect(hashedPassword: string, token?: Token): Promise<boolean> {
    const url = '/auth/are-credentials-correct';

    return this.client
      .getWithParams<boolean>(url, { hashedPassword }, this.headersWithToken(token ?? <string>this.apiSecurity?.token))
      .then((res) => {
        return res;
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          return false;
        }
        throw new Error(`Request failed with status ${error.response?.status}: ${error.response?.data}`);
      });
  }

  /**
   * Send email to change password
   * @param email
   */
  public sendChangePasswordEmail(email: string): Promise<void> {
    return this.client.post(
      '/users/recover-account',
      {
        email: email,
      },
      this.basicHeaders(),
    );
  }

  /**
   * Restore password with email link
   * @param token
   * @param password
   * @param salt
   * @param mnemonic
   */
  public changePasswordWithLink(
    token: string | undefined,
    password: string,
    salt: string,
    mnemonic: string,
  ): Promise<void> {
    return this.client.put(
      `/users/recover-account?token=${token}&reset=false`,
      {
        password: password,
        salt: salt,
        mnemonic: mnemonic,
      },
      this.basicHeaders(),
    );
  }

  /**
   * Reset account with token
   * @param token
   * @param password
   * @param salt
   * @param mnemonic
   */
  public resetAccountWithToken(
    token: string | undefined,
    password: string,
    salt: string,
    mnemonic: string,
  ): Promise<void> {
    return this.client.put(
      `/users/recover-account?token=${token}&reset=true`,
      {
        password: password,
        salt: salt,
        mnemonic: mnemonic,
      },
      this.basicHeaders(),
    );
  }

  private basicHeaders() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }

  private headersWithToken(token: Token) {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, token);
  }
}
