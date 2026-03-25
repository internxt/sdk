import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import {
  EncryptedKeystore,
  KeystoreType,
  HybridEncryptedEmail,
  PwdProtectedEmail,
  HybridKeyPair,
  Email,
  RecipientWithPublicKey,
  EmailPublicParameters,
} from 'internxt-crypto';

import { MailApi } from './api';
import {
  MailboxResponse,
  EmailListResponse,
  EmailResponse,
  EmailCreatedResponse,
  SendEmailRequest,
  DraftEmailRequest,
  UpdateEmailRequest,
  ListEmailsQuery,
} from './types';
import { createKeystores, encryptEmail, passwordProtectAndSendEmail, openKeystore, recoverKeys } from './crypto';

export class Mail {
  private readonly api: MailApi;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Mail(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.api = MailApi.client(apiUrl, appDetails, apiSecurity);
  }

  /**
   * Uploads encrypted keystore to the server
   *
   * @param encryptedKeystore - The encrypted keystore
   * @returns Server response
   */
  async uploadKeystoreToServer(encryptedKeystore: EncryptedKeystore): Promise<void> {
    return this.api.uploadKeystore(encryptedKeystore);
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
    await Promise.all([this.api.uploadKeystore(encryptionKeystore), this.api.uploadKeystore(recoveryKeystore)]);
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
    return this.api.downloadKeystore(userEmail, keystoreType);
  }

  /**
   * Requests encrypted keystore from the server and opens it
   *
   * @param userEmail - The email of the user
   * @param baseKey - The secret key of the user
   * @returns The hybrid keys of the user
   */
  async getUserEmailKeys(userEmail: string, baseKey: Uint8Array): Promise<HybridKeyPair> {
    const keystore = await this.api.downloadKeystore(userEmail, KeystoreType.ENCRYPTION);
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
    const keystore = await this.api.downloadKeystore(userEmail, KeystoreType.RECOVERY);
    return recoverKeys(keystore, recoveryCodes);
  }

  /**
   * Request user with corresponding public keys from the server
   *
   * @param userEmail - The email of the user
   * @returns User with corresponding public keys
   */
  async getUserWithPublicKeys(userEmail: string): Promise<RecipientWithPublicKey> {
    const results = await this.api.getUsersWithPublicKeys([userEmail]);
    if (!results[0]) throw new Error(`No public keys found for ${userEmail}`);
    return results[0];
  }

  /**
   * Request users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  async getSeveralUsersWithPublicKeys(emails: string[]): Promise<RecipientWithPublicKey[]> {
    return this.api.getUsersWithPublicKeys(emails);
  }

  /**
   * Sends the encrypted emails to the server
   *
   * @param emails - The encrypted emails
   * @param params - The public parameters of the email (sender, recipients, CCs, BCCs, etc.)
   * @returns Server response
   */
  async sendEncryptedEmail(emails: HybridEncryptedEmail[], params: EmailPublicParameters): Promise<void> {
    return this.api.sendEmails(emails, params);
  }

  /**
   * Encrypts and sends email(s) to the server
   *
   * @param email - The message to encrypt
   * @param aux - The optional auxilary data to encrypt together with the email (e.g. email sender)
   * @returns Server response
   */
  async encryptAndSendEmail(email: Email, aux?: string): Promise<void> {
    const recipientEmails = email.params.recipients?.map((user) => user.email);

    if (!recipientEmails) throw new Error('No recipients found');

    const recipients = await this.api.getUsersWithPublicKeys(recipientEmails);

    const encEmails = await encryptEmail(email, recipients, aux);
    return this.api.sendEmails(encEmails, email.params);
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @param params - The public parameters of the email
   * @returns Server response
   */
  async sendPasswordProtectedEmail(email: PwdProtectedEmail, params: EmailPublicParameters): Promise<void> {
    return this.api.sendPasswordProtectedEmail(email, params);
  }

  /**
   * Creates the password-protected email and sends it to the server
   *
   * @param email - The email
   * @param pwd - The password
   * @param aux - The optional auxiliary data to encrypt together with the email (e.g. email sender)
   * @returns Server response
   */
  async passwordProtectAndSendEmail(email: Email, pwd: string, aux?: string): Promise<void> {
    const encEmail = await passwordProtectAndSendEmail(email, pwd, aux);
    return this.api.sendPasswordProtectedEmail(encEmail, email.params);
  }

  async getMailboxes(): Promise<MailboxResponse[]> {
    return this.api.getMailboxes();
  }

  async listEmails(query?: ListEmailsQuery): Promise<EmailListResponse> {
    return this.api.listEmails(query);
  }

  async getEmail(id: string): Promise<EmailResponse> {
    return this.api.getEmail(id);
  }

  async deleteEmail(id: string): Promise<void> {
    return this.api.deleteEmail(id);
  }

  async updateEmail(id: string, body: UpdateEmailRequest): Promise<void> {
    return this.api.updateEmail(id, body);
  }

  async sendEmail(body: SendEmailRequest): Promise<EmailCreatedResponse> {
    return this.api.sendEmail(body);
  }

  async saveDraft(body: DraftEmailRequest): Promise<EmailCreatedResponse> {
    return this.api.saveDraft(body);
  }
}

export * from './crypto';
export * from './types';
