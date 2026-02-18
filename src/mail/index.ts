import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  EncryptedKeystore,
  KeystoreType,
  PublicKeysBase64,
  PrivateKeys,
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
  async getUserWithPublicKeys(userEmail: string): Promise<UserWithPublicKeys> {
    const response = await this.client.post<{ publicKeys: PublicKeysBase64; user: User }[]>(
      `${this.apiUrl}/users/public-keys`,
      { emails: [userEmail] },
      this.headers(),
    );
    if (!response[0]) throw new Error(`No public keys found for ${userEmail}`);
    const singleResponse = response[0];
    const publicKeys = await base64ToPublicKey(singleResponse.publicKeys);
    const result = { ...singleResponse.user, publicKeys };
    return result;
  }

  /**
   * Request users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  async getSeveralUsersWithPublicKeys(emails: string[]): Promise<UserWithPublicKeys[]> {
    const response = await this.client.post<{ publicKeys: PublicKeysBase64; user: User }[]>(
      `${this.apiUrl}/users/public-keys`,
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
    return this.client.post(`${this.apiUrl}/emails`, { emails: [email] }, this.headers());
  }

  /**
   * Encrypts email and sends it to the server
   *
   * @param email - The message to encrypt
   * @param senderPrivateKeys - The private keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmail(
    email: Email,
    senderPrivateKeys: PrivateKeys,
    isSubjectEncrypted: boolean = false,
  ): Promise<void> {
    const recipient = await this.getUserWithPublicKeys(email.params.recipient.email);
    const encEmail = await encryptEmailHybrid(email, recipient, senderPrivateKeys, isSubjectEncrypted);
    return this.sendEncryptedEmail(encEmail);
  }

  /**
   * Sends the encrypted emails for multiple recipients to the server
   *
   * @param emails - The encrypted emails
   * @returns Server response
   */
  async sendEncryptedEmailToMultipleRecipients(emails: HybridEncryptedEmail[]): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { emails }, this.headers());
  }

  /**
   * Encrypts emails for multiple recipients and sends emails to the server
   *
   * @param email - The message to encrypt
   * @param senderPrivateKeys - The private keys of the sender
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async encryptAndSendEmailToMultipleRecipients(
    email: Email,
    senderPrivateKeys: PrivateKeys,
    isSubjectEncrypted: boolean = false,
  ): Promise<void> {
    const recipientEmails = email.params.recipients
      ? email.params.recipients.map((user) => user.email)
      : [email.params.recipient.email];

    const recipients = await this.getSeveralUsersWithPublicKeys(recipientEmails);
    const encEmails = await encryptEmailHybridForMultipleRecipients(
      email,
      recipients,
      senderPrivateKeys,
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
  async sendPasswordProtectedEmail(email: PwdProtectedEmail): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { email }, this.headers());
  }

  /**
   * Creates the password-protected email and sends it to the server
   *
   * @param email - The email
   * @param pwd - The password
   * @param isSubjectEncrypted - Indicates if the subject field should be encrypted
   * @returns Server response
   */
  async passwordProtectAndSendEmail(email: Email, pwd: string, isSubjectEncrypted: boolean = false): Promise<void> {
    const encEmail = await createPwdProtectedEmail(email, pwd, isSubjectEncrypted);
    return this.sendPasswordProtectedEmail(encEmail);
  }

  /**
   * Opens the password-protected email
   *
   * @param email - The password-protected email
   * @param pwd - The shared password
   * @returns The decrypted email
   */
  async openPasswordProtectedEmail(email: PwdProtectedEmail, pwd: string): Promise<Email> {
    return decryptPwdProtectedEmail(email, pwd);
  }

  /**
   * Decrypt the email
   *
   * @param email - The encrypted email
   * @param recipientPrivateKeys - The private keys of the email recipient
   * @returns The decrypted email
   */
  async decryptEmail(email: HybridEncryptedEmail, recipientPrivateKeys: PrivateKeys): Promise<Email> {
    const senderEmail = email.params.sender.email;
    const sender = await this.getUserWithPublicKeys(senderEmail);
    return decryptEmailHybrid(email, sender.publicKeys, recipientPrivateKeys);
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
