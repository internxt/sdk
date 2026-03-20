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
  EmailBody,
  createEncryptionAndRecoveryKeystores,
  encryptEmailHybrid,
  openEncryptionKeystore,
  RecipientWithPublicKey,
  encryptEmailHybridForMultipleRecipients,
  decryptEmailHybrid,
  createPwdProtectedEmail,
  decryptPwdProtectedEmail,
  openRecoveryKeystore,
  UTF8ToUint8,
  base64ToUint8Array,
  EmailPublicParameters,
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
    return this.client.post(`${this.apiUrl}/keystore`, { encryptedKeystore }, this.headers());
  }

  /**
   * Creates recovery and encryption keystores and uploads them to the server
   *
   * @param userEmail - The email of the user
   * @param baseKey - The secret key of the user
   * @returns The recovery codes for opening recovery keystore
   */
  async createAndUploadKeystores(userEmail: string, baseKey: Uint8Array): Promise<string> {
    const { encryptionKeystore, recoveryKeystore, recoveryCodes } = await createEncryptionAndRecoveryKeystores(
      userEmail,
      baseKey,
    );
    await Promise.all([this.uploadKeystoreToServer(encryptionKeystore), this.uploadKeystoreToServer(recoveryKeystore)]);
    return recoveryCodes;
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
    return openEncryptionKeystore(keystore, baseKey);
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
    return openRecoveryKeystore(recoveryCodes, keystore);
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
   * Sends the encrypted email to the server
   *
   * @param email - The encrypted email
   * @param params - The public parameters of the email (sender, recipients, replyTo, etc.)
   * @returns Server response
   */
  async sendEncryptedEmail(email: HybridEncryptedEmail, params: EmailPublicParameters): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { emails: [email], params }, this.headers());
  }

  /**
   * Encrypts email and sends it to the server
   *
   * @param email - The message to encrypt
   * @param aux - An optional string that can be used as additional input for the encryption
   * @returns Server response
   */
  async encryptAndSendEmail(email: Email, aux?: string): Promise<void> {
    const recipient = await this.getUserWithPublicKeys(email.params.recipient.email);
    const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
    const encEmail = await encryptEmailHybrid(email.body, recipient, auxArray);
    return this.sendEncryptedEmail(encEmail, email.params);
  }

  /**
   * Sends the encrypted emails for multiple recipients to the server
   *
   * @param emails - The encrypted emails
   * @param params - The public parameters of the email (sender, recipients, replyTo, etc.)
   * @returns Server response
   */
  async sendEncryptedEmailToMultipleRecipients(
    emails: HybridEncryptedEmail[],
    params: EmailPublicParameters,
  ): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { emails, params }, this.headers());
  }

  /**
   * Encrypts emails for multiple recipients and sends emails to the server
   *
   * @param email - The message to encrypt
   * @param senderPrivateKeys - The private keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmailToMultipleRecipients(email: Email, aux?: string): Promise<void> {
    const recipientEmails = email.params.recipients
      ? email.params.recipients.map((user) => user.email)
      : [email.params.recipient.email];

    const recipients = await this.getSeveralUsersWithPublicKeys(recipientEmails);
    const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
    const encEmails = await encryptEmailHybridForMultipleRecipients(email.body, recipients, auxArray);
    return this.sendEncryptedEmailToMultipleRecipients(encEmails, email.params);
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
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async passwordProtectAndSendEmail(email: Email, pwd: string, aux?: string): Promise<void> {
    const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
    const encEmail = await createPwdProtectedEmail(email.body, pwd, auxArray);
    return this.sendPasswordProtectedEmail(encEmail, email.params);
  }

  /**
   * Opens the password-protected email
   *
   * @param email - The password-protected email
   * @param pwd - The shared password
   * @returns The decrypted email body
   */
  async openPasswordProtectedEmail(email: PwdProtectedEmail, pwd: string): Promise<EmailBody> {
    return decryptPwdProtectedEmail(email, pwd);
  }

  /**
   * Decrypt the email
   *
   * @param email - The encrypted email
   * @param recipientPrivateKeys - The private keys of the email recipient
   * @returns The decrypted email body
   */
  async decryptEmail(email: HybridEncryptedEmail, recipientPrivateKeys: Uint8Array): Promise<EmailBody> {
    return decryptEmailHybrid(email, recipientPrivateKeys);
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
