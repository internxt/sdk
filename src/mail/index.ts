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
  encryptEmailHybrid,
  User,
  openEncryptionKeystore,
  UserWithPublicKeys,
  encryptEmailHybridForMultipleRecipients,
  decryptEmailHybrid,
  createPwdProtectedEmail,
  decryptPwdProtectedEmail,
  openRecoveryKeystore,
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
   * @param baseKey - The secret key of the user
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
   * @param baseKey - The secret key of the user
   * @returns The email keys of the user
   */
  async getUserEmailKeys(userEmail: string, baseKey: Uint8Array): Promise<EmailKeys> {
    const keystore = await this.downloadKeystoreFromServer(userEmail, KeystoreType.ENCRYPTION);
    return openEncryptionKeystore(keystore, baseKey);
  }

  /**
   * Requests recovery keystore from the server and opens it
   *
   * @param userEmail - The email of the user
   * @param recoveryCodes - The recovery codes of the user
   * @returns The email keys of the user
   */
  async recoverUserEmailKeys(userEmail: string, recoveryCodes: string): Promise<EmailKeys> {
    const keystore = await this.downloadKeystoreFromServer(userEmail, KeystoreType.RECOVERY);
    return openRecoveryKeystore(recoveryCodes, keystore);
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
   * @param senderKeys - The email keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmail(email: Email, senderKeys: EmailKeys, isSubjectEncrypted: boolean = false): Promise<void> {
    const recipient = await this.getUserPublicKeys(email.params.recipient.email);
    const encEmail = await encryptEmailHybrid(email, recipient, senderKeys.privateKeys, isSubjectEncrypted);
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
   * @param senderKeys - The email keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmailToMultipleRecipients(
    email: Email,
    senderKeys: EmailKeys,
    isSubjectEncrypted: boolean = false,
  ): Promise<void> {
    const recipientEmails = email.params.recipients
      ? email.params.recipients.map((user) => user.email)
      : [email.params.recipient.email];

    const recipients = await this.getPublicKeysOfSeveralUsers(recipientEmails);
    const encEmails = await encryptEmailHybridForMultipleRecipients(
      email,
      recipients,
      senderKeys.privateKeys,
      isSubjectEncrypted,
    );
    return this.sendEncryptedEmailToMultipleRecipients(encEmails);
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
   * Creates the password-protected email and sends it to the server
   *
   * @param email - The email
   * @param pwd - The password
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async pwdProtectAndSendEmail(email: Email, pwd: string, isSubjectEncrypted: boolean = false): Promise<void> {
    const encEmail = await createPwdProtectedEmail(email, pwd, isSubjectEncrypted);
    return this.sendPwdProtectedEmail(encEmail);
  }

  /**
   * Opens the password-protected email
   *
   * @param email - The password-protected email
   * @param pwd - The shared password
   * @returns The decrypted email
   */
  async openPwdProtectedEmail(email: PwdProtectedEmail, pwd: string): Promise<Email> {
    return decryptPwdProtectedEmail(email, pwd);
  }

  /**
   * Decrypt the email
   *
   * @param email - The encrypted email
   * @param keys - The email keys of the email recipient
   * @returns The decrypted email
   */
  async decryptEmail(email: HybridEncryptedEmail, keys: EmailKeys): Promise<Email> {
    const senderEmail = email.params.sender.email;
    const pk = await this.getUserPublicKeys(senderEmail);
    return decryptEmailHybrid(email, pk.publicKeys, keys.privateKeys);
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
