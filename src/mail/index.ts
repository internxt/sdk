import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  EncryptedKeystore,
  KeystoreType,
  HybridEncryptedEmail,
  PwdProtectedEmail,
  HybridKeyPair,
  Email,
  RecipientWithPublicKey,
  base64ToUint8Array,
  EmailPublicParameters,
} from 'internxt-crypto';

import { createKeystores, encryptEmail, passwordProtectAndSendEmail, openKeystore, recoverKeys } from './create';

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
    return this.client.post(`${this.apiUrl}/keystore`, { encryptedKeystore }, this.headers());
  }

  /**
   * Creates recovery and encryption keystores and uploads them to the server
   *
   * @param userEmail - The email of the user
   * @param baseKey - The secret key of the user
   * @returns The recovery codes and keys of the user
   */
  async createAndUploadKeystores(
    userEmail: string,
    baseKey: Uint8Array,
  ): Promise<{ recoveryCodes: string; keys: HybridKeyPair }> {
    const { encryptionKeystore, recoveryKeystore, recoveryCodes, keys } = await createKeystores(userEmail, baseKey);
    await Promise.all([this.uploadKeystoreToServer(encryptionKeystore), this.uploadKeystoreToServer(recoveryKeystore)]);
    return { recoveryCodes, keys };
  }

  /**
   * Requests encrypted keystore from the server
   *
   * @param userEmail - The email of the user
   * @param keystoreType - The type of the keystore
   * @returns The encrypted keystore
   */
  async downloadKeystoreFromServer(userEmail: string, keystoreType: KeystoreType): Promise<EncryptedKeystore> {
    return this.client.getWithParams(`${this.apiUrl}/user/keystore`, { userEmail, keystoreType }, this.headers());
  }

  /**
   * Requests encrypted keystore from the server and opens it
   *
   * @param userEmail - The email of the user
   * @param baseKey - The secret key of the user
   * @returns The hybrid keys of the user
   */
  async getUserEmailKeys(userEmail: string, baseKey: Uint8Array): Promise<HybridKeyPair> {
    const keystore = await this.downloadKeystoreFromServer(userEmail, KeystoreType.ENCRYPTION);
    return openKeystore(keystore, baseKey);
  }

  /**
   * Requests recovery keystore from the server and opens it
   *
   * @param userEmail - The email of the user
   * @param recoveryCodes - The recovery codes of the user
   * @returns The hybrid keys of the user
   */
  async recoverUserEmailKeys(userEmail: string, recoveryCodes: string): Promise<HybridKeyPair> {
    const keystore = await this.downloadKeystoreFromServer(userEmail, KeystoreType.RECOVERY);
    return recoverKeys(keystore, recoveryCodes);
  }

  /**
   * Request user with corresponding public keys from the server
   *
   * @param userEmail - The email of the user
   * @returns User with corresponding public keys
   */
  async getUserWithPublicKeys(userEmail: string): Promise<RecipientWithPublicKey> {
    const response = await this.client.post<{ publicKey: string; email: string }[]>(
      `${this.apiUrl}/users/public-keys`,
      { emails: [userEmail] },
      this.headers(),
    );
    if (!response[0]) throw new Error(`No public keys found for ${userEmail}`);
    const singleResponse = response[0];
    const publicHybridKey = base64ToUint8Array(singleResponse.publicKey);
    const result = { email: singleResponse.email, publicHybridKey };
    return result;
  }

  /**
   * Request users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  async getSeveralUsersWithPublicKeys(emails: string[]): Promise<RecipientWithPublicKey[]> {
    const response = await this.client.post<{ publicKey: string; email: string }[]>(
      `${this.apiUrl}/users/public-keys`,
      { emails },
      this.headers(),
    );

    const result = await Promise.all(
      response.map(async (item) => {
        const publicHybridKey = base64ToUint8Array(item.publicKey);
        return { email: item.email, publicHybridKey };
      }),
    );

    return result;
  }

  /**
   * Sends the encrypted emails to the server
   *
   * @param emails - The encrypted emails
   * @param params - The public parameters of the email (sender, recipients, CCs, BCCs, etc.)
   * @returns Server response
   */
  async sendEncryptedEmail(emails: HybridEncryptedEmail[], params: EmailPublicParameters): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { emails, params }, this.headers());
  }

  /**
   * Encrypts and sends email(s) to the server
   *
   * @param email - The message to encrypt
   * @param aux - The optional auxilary data to encrypt together with the email (e.g. email sender)
   * @returns Server response
   */
  async encryptAndSendEmail(email: Email, aux?: string): Promise<void> {
    const recipientEmails = email.params.recipients.map((user) => user.email);
    const recipients = await this.getSeveralUsersWithPublicKeys(recipientEmails);

    const encEmails = await encryptEmail(email, recipients, aux);
    return this.sendEncryptedEmail(encEmails, email.params);
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @returns Server response
   */
  async sendPasswordProtectedEmail(email: PwdProtectedEmail, params: EmailPublicParameters): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { email, params }, this.headers());
  }

  /**
   * Creates the password-protected email and sends it to the server
   *
   * @param email - The email
   * @param pwd - The password
   * @param aux - The optional auxilary data to encrypt together with the email (e.g. email sender)
   * @returns Server response
   */
  async passwordProtectAndSendEmail(email: Email, pwd: string, aux?: string): Promise<void> {
    const encEmail = await passwordProtectAndSendEmail(email, pwd, aux);
    return this.sendPasswordProtectedEmail(encEmail, email.params);
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
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
