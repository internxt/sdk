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
            privateKey: registerDetails.keys.keys.ecc.privateKeyEncrypted,
            publicKey: registerDetails.keys.keys.ecc.publicKey,
          },
          kyber: {
            privateKey: registerDetails.keys.keys.kyber.privateKeyEncrypted,
            publicKey: registerDetails.keys.keys.kyber.publicKey,
          }
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
            privateKey: registerDetails.keys.keys.ecc.privateKeyEncrypted,
            publicKey: registerDetails.keys.keys.ecc.publicKey,
          },
          kyber: {
            privateKey: registerDetails.keys.keys.kyber.privateKeyEncrypted,
            publicKey: registerDetails.keys.keys.kyber.publicKey,
          }
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
    const encryptedPasswordHash = await cryptoProvider.encryptPasswordHash(details.password, encryptedSalt);
    const keys = await cryptoProvider.generateKeys(details.password);

    return this.client
      .post<{
        token: Token;
        newToken: Token;
        user: UserSettings;
        userTeam: TeamsSettings | null;
      }>(
        '/access',
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
              privateKey: keys.keys.ecc.privateKeyEncrypted,
              publicKey: keys.keys.ecc.publicKey,
            },
            kyber: {
              privateKey: keys.keys.kyber.privateKeyEncrypted,
              publicKey: keys.keys.kyber.publicKey,
            }
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
        keys: {
          ecc: {
            privateKey: keys.keys.ecc.privateKeyEncrypted,
            publicKey: keys.keys.ecc.publicKey,
          },
          kyber: {
            privateKey: keys.keys.kyber.privateKeyEncrypted,
            publicKey: keys.keys.kyber.publicKey,
          }
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
        '/login',
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
   * Generates a new TwoFactorAuth code
   */
  public generateTwoFactorAuthQR(): Promise<TwoFactorAuthQR> {
    return this.client
      .get<{
        qr: string;
        code: string;
      }>('/tfa', this.headersWithToken(<string>this.apiSecurity?.token))
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
  public disableTwoFactorAuth(pass: string, code: string): Promise<void> {
    return this.client.delete('/tfa', this.headersWithToken(<string>this.apiSecurity?.token), {
      pass: pass,
      code: code,
    });
  }

  /**
   * Store TwoFactorAuthentication details
   * @param backupKey
   * @param code
   */
  public storeTwoFactorAuthKey(backupKey: string, code: string): Promise<void> {
    return this.client.put(
      '/tfa',
      {
        key: backupKey,
        code: code,
      },
      this.headersWithToken(<string>this.apiSecurity?.token),
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
   * Checks if the password is correct for this email
   * @param email
   * @param hashedPassword
   * @returns
   */

  public areCredentialsCorrect(email: string, hashedPassword: string): Promise<boolean> {
    // Uses fetch instead of httpClient since a 401 response
    // would log out the user
    return fetch(`${this.apiUrl}/are-credentials-correct?email=${email}&hashedPassword=${hashedPassword}`, {
      headers: this.headersWithToken(this.apiSecurity?.token as string),
    }).then((res) => {
      if (res.ok) {
        return true;
      } else if (res.status === 401) {
        return false;
      } else throw new Error(`Request failed with error ${res.status}`);
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
   * Upgrade hash in the database
   * @param newHash
   */
  public upgradeHash(newHash: string): Promise<void> {
    return this.client.post(
      '/users/upgrade-hash',
      {
        newHash: newHash,
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
