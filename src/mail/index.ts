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
  EmailKeys,
  Email,
  createEncryptionAndRecoveryKeystores,
  encryptEmailAndSubjectHybrid,
  encryptEmailHybrid,
  User,
  openEncryptionKeystore,
  UserWithPublicKeys,
  encryptEmailAndSubjectHybridForMultipleRecipients,
  encryptEmailHybridForMultipleRecipients,
  createPwdProtectedEmailAndSubject,
  createPwdProtectedEmail,
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
   * Creates recovery and encryption keystores and uploads them to the server
   *
   * @param userEmail - The email of the user
   * @param baseKey - The secret base key of the user
   * @returns The recovery codes for opening recovery keystore
   */
  async createAndUploadKeystores(userEmail: string, baseKey: Uint8Array): Promise<string> {
    const { encryptionKeystore, recoveryKeystore, recoveryCodes } = await createEncryptionAndRecoveryKeystores(
      userEmail,
      baseKey,
    );
    await this.uploadKeystoreToServer(encryptionKeystore);
    await this.uploadKeystoreToServer(recoveryKeystore);
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
    return this.client.getWithParams(`${this.apiUrl}/getKeystore`, { userEmail, keystoreType }, this.headers());
  }

  /**
   * Requests encrypted keystore from the server and opens it
   *
   * @param userEmail - The email of the user
   * @param baseKey - The secret base key of the user
   * @returns The email keys of the user
   */
  async getUserEmailKeys(userEmail: string, baseKey: Uint8Array): Promise<EmailKeys> {
    const keystore = await this.downloadKeystoreFromServer(userEmail, KeystoreType.ENCRYPTION);
    const keys = await openEncryptionKeystore(keystore, baseKey);
    return keys;
  }

  /**
   * Request user with corresponding public keys from the server
   *
   * @param userEmail - The email of the user
   * @returns User with corresponding public keys
   */
  async getUserPublicKeys(userEmail: string): Promise<UserWithPublicKeys> {
    const response = await this.client.getWithParams<{ publicKeys: PublicKeysBase64; user: User }>(
      `${this.apiUrl}/getUserPublicKeys`,
      { userEmail },
      this.headers(),
    );
    const publicKeys = await base64ToPublicKey(response.publicKeys);
    const result = { ...response.user, publicKeys };
    return result;
  }

  /**
   * Request users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  async getPublicKeysOfSeveralUsers(emails: string[]): Promise<UserWithPublicKeys[]> {
    const response = await this.client.getWithParams<{ publicKeys: PublicKeysBase64; user: User }[]>(
      `${this.apiUrl}/getPublicKeysOfSeveralUsers`,
      { emails },
      this.headers(),
    );

    const result = await Promise.all(
      response.map(async (item) => {
        const publicKeys = await base64ToPublicKey(item.publicKeys);
        return { ...item.user, publicKeys };
      }),
    );

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
   * Encrypts email and sends it to the server
   *
   * @param email - The message to encrypt
   * @param recipientEmail - The email of the recipient
   * @param senderKeys - The email keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmail(
    email: Email,
    recipientEmail: string,
    senderKeys: EmailKeys,
    isSubjectEncrypted: boolean = false,
  ): Promise<void> {
    const recipient = await this.getUserPublicKeys(recipientEmail);
    let encEmail: HybridEncryptedEmail;
    if (isSubjectEncrypted) encEmail = await encryptEmailAndSubjectHybrid(email, recipient, senderKeys.privateKeys);
    else encEmail = await encryptEmailHybrid(email, recipient, senderKeys.privateKeys);
    return this.sendEncryptedEmail(encEmail);
  }

  /**
   * Sends the encrypted emails for multiple recipients to the server
   *
   * @param emails - The encrypted emails
   * @returns Server response
   */
  async sendEncryptedEmailToMultipleRecipients(emails: HybridEncryptedEmail[]): Promise<void> {
    return this.client.post(`${this.apiUrl}/sendEncryptedEmailToMultipleRecipients`, { emails }, this.headers());
  }

  /**
   * Encrypts emails for multiple recipients and sends emails to the server
   *
   * @param email - The message to encrypt
   * @param recipientEmails - The emails of the recipients
   * @param senderKeys - The email keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmailToMultipleRecipients(
    email: Email,
    recipientEmails: string[],
    senderKeys: EmailKeys,
    isSubjectEncrypted: boolean = false,
  ): Promise<void> {
    const recipients = await this.getPublicKeysOfSeveralUsers(recipientEmails);
    let encEmails: HybridEncryptedEmail[];
    if (isSubjectEncrypted)
      encEmails = await encryptEmailAndSubjectHybridForMultipleRecipients(email, recipients, senderKeys.privateKeys);
    else encEmails = await encryptEmailHybridForMultipleRecipients(email, recipients, senderKeys.privateKeys);
    return this.sendEncryptedEmailToMultipleRecipients(encEmails);
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @param recipientEmails - The emails of the recipients
   * @returns Server response
   */
  async sendPwdProtectedEmail(email: PwdProtectedEmail, recipientEmails: string[]): Promise<void> {
    return this.client.post(`${this.apiUrl}/sendPwdProtectedEmail`, { email, recipientEmails }, this.headers());
  }

  /**
   * Creates the password-protected email and sends it to the server
   *
   * @param email - The email
   * @param recipientEmails - The emails of the recipients
   * @returns Server response
   */
  async pwdProtectAndSendEmail(
    email: Email,
    recipientEmails: string[],
    pwd: string,
    isSubjectEncrypted: boolean = false,
  ): Promise<void> {
    let encEmail: PwdProtectedEmail;
    if (isSubjectEncrypted) encEmail = await createPwdProtectedEmailAndSubject(email, pwd);
    else encEmail = await createPwdProtectedEmail(email, pwd);
    return this.sendPwdProtectedEmail(encEmail, recipientEmails);
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
