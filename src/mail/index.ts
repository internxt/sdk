import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  EncryptedKeystore,
  KeystoreType,
  PublicKeysBase64,
  HybridEncryptedEmail,
  PwdProtectedEmail,
  base64ToPublicKey,
  PublicKeys,
} from 'internxt-crypto';

export class Mail {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;
  private readonly apiUrl: ApiUrl;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Mail(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
    this.apiUrl = apiUrl;
  }

  /**
   * Uploads encrypted keystore to the server
   *
   * @param encryptedKeystore - The encrypted keystore
   * @returns Server response
   */
  async uploadKeystoreToServer(encryptedKeystore: EncryptedKeystore): Promise<void> {
    return this.client.post(`${this.apiUrl}/uploadKeystore`, { encryptedKeystore }, this.headers());
  }

  /**
   * Requests encrypted keystore from the server
   *
   * @param userEmail - The email of the user
   * @param keystoreType - The type of the keystore
   * @returns The encrypted keystore
   */
  async downloadKeystoreFromServer(userEmail: string, keystoreType: KeystoreType): Promise<EncryptedKeystore> {
    return this.client.getWithParams(`${this.apiUrl}/getKeystore`, { userEmail, keystoreType }, this.headers());
  }

  /**
   * Request user public keys from the server
   *
   * @param userEmail - The email of the user
   * @returns User public keys
   */
  async getUserPublicKeys(userEmail: string): Promise<PublicKeys> {
    const base64Keys = await this.client.getWithParams<PublicKeysBase64>(
      `${this.apiUrl}/getUserPublicKeys`,
      { userEmail },
      this.headers(),
    );
    return base64ToPublicKey(base64Keys);
  }

  /**
   * Request recipients public keys from the server
   *
   * @param emails - The emails of the recipients
   * @returns Recipients public keys
   */
  async getRecipientsPublicKeys(emails: string[]): Promise<PublicKeys[]> {
    const base64Keys = await this.client.getWithParams<PublicKeysBase64[]>(
      `${this.apiUrl}/getRecipientsPublicKeys`,
      { emails },
      this.headers(),
    );
    const result = await Promise.all(base64Keys.map(base64ToPublicKey));
    return result;
  }

  /**
   * Sends the encrypted email to the server
   *
   * @param email - The encrypted email
   * @returns Server response
   */
  async sendEncryptedEmail(email: HybridEncryptedEmail): Promise<void> {
    return this.client.post(`${this.apiUrl}/sendEncryptedEmail`, { email }, this.headers());
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @returns Server response
   */
  async sendPwdProtectedEmail(email: PwdProtectedEmail): Promise<void> {
    return this.client.post(`${this.apiUrl}/sendPwdProtectedEmail`, { email }, this.headers());
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: this.apiSecurity.token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
    });
  }
}
