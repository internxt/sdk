import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  EncryptedKeystore,
  KeystoreType,
  HybridEncryptedEmail,
  PwdProtectedEmail,
  RecipientWithPublicKey,
  base64ToUint8Array,
  EmailPublicParameters,
} from 'internxt-crypto';
import {
  MailboxResponse,
  EmailListResponse,
  EmailResponse,
  EmailCreatedResponse,
  SendEmailRequest,
  DraftEmailRequest,
  UpdateEmailRequest,
  ListEmailsQuery,
  EmailDomainsResponse,
} from './types';

export class MailApi {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;
  private readonly apiUrl: ApiUrl;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new MailApi(apiUrl, appDetails, apiSecurity);
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
   * @param keystore - The encrypted keystore
   * @returns Server response
   */
  async uploadKeystore(keystore: EncryptedKeystore): Promise<void> {
    return this.client.post('/keystore', { encryptedKeystore: keystore }, this.headers());
  }

  /**
   * Requests encrypted keystore from the server
   *
   * @param userEmail - The email of the user
   * @param keystoreType - The type of the keystore
   * @returns The encrypted keystore
   */
  async downloadKeystore(userEmail: string, keystoreType: KeystoreType): Promise<EncryptedKeystore> {
    return this.client.getWithParams('/user/keystore', { userEmail, keystoreType }, this.headers());
  }

  /**
   * Requests users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  async getUsersWithPublicKeys(emails: string[]): Promise<RecipientWithPublicKey[]> {
    const response = await this.client.post<{ publicKey: string; email: string }[]>(
      '/users/public-keys',
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
   * @param params - The public parameters of the email
   * @returns Server response
   */
  async sendE2EEmails(emails: HybridEncryptedEmail[], params: EmailPublicParameters): Promise<void> {
    return this.client.post('/emails', { emails, params }, this.headers());
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @param params - The public parameters of the email
   * @returns Server response
   */
  async sendE2EPasswordProtectedEmail(email: PwdProtectedEmail, params: EmailPublicParameters): Promise<void> {
    return this.client.post('/emails', { email, params }, this.headers());
  }

  /**
   * Gets the mailboxes of the user
   *
   * @returns The mailboxes of the user - `MailboxResponse[]`
   */
  async getMailboxes(): Promise<MailboxResponse[]> {
    return this.client.get('/email/mailboxes', this.headers());
  }

  /**
   * Lists emails of the user
   *
   * @param query - The query to filter emails (e.g. mailbox, limit, etc.)
   * @returns The list of emails - `EmailListResponse`
   */
  async listEmails(query?: ListEmailsQuery): Promise<EmailListResponse> {
    return this.client.getWithParams('/email', query ?? {}, this.headers());
  }

  /**
   * Gets the email with the corresponding id
   *
   * @param id - The id of the email
   * @returns The email with the corresponding id - `EmailResponse`
   */
  async getEmail(id: string): Promise<EmailResponse> {
    return this.client.get(`/email/${id}`, this.headers());
  }

  /**
   * Deletes the email with the corresponding id
   *
   * @param id - The id of the email to delete
   * @returns A promise that resolves when the email is deleted
   */
  async deleteEmail(id: string): Promise<void> {
    return this.client.delete(`/email/${id}`, this.headers());
  }

  /**
   * Updates the email with the corresponding id
   *
   * @param id - The id of the email to update
   * @param body - The new body of the email
   * @returns A promise that resolves when the email is updated
   */
  async updateEmail(id: string, body: UpdateEmailRequest): Promise<void> {
    return this.client.patch(`/email/${id}`, body, this.headers());
  }

  /**
   * Sends an email to the specified recipients
   *
   * @param body - The body of the email to send
   * @returns The created email
   */
  async sendEmail(body: SendEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.post('/email/send', body, this.headers());
  }

  /**
   * Saves a draft email
   *
   * @param body - The body of the draft email to save
   * @returns The created email - `EmailCreatedResponse`
   */
  async saveDraft(body: DraftEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.post('/email/drafts', body, this.headers());
  }

  /**
   * Returns the list of active domains for the email gateway
   *
   * @returns The list of active domains - `ActiveDomainsResponse`
   */
  async getActiveDomains(): Promise<EmailDomainsResponse> {
    return this.client.get('/email/domains', this.headers());
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
