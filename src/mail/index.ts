import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
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
  SetupMailAccountPayload,
  SearchFiltersQuery,
  MailAccountKeysResponse,
  EncryptedKeystore,
  KeystoreType,
  RecipientWithPublicKey,
  HybridEncryptedEmail,
  EmailPublicParameters,
  PwdProtectedEmail,
} from './types';

export class MailApi {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new MailApi(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Uploads encrypted keystore to the server
   *
   * @param keystore - The encrypted keystore
   * @returns Server response
   */
  uploadKeystore(keystore: EncryptedKeystore): Promise<void> {
    return this.client.post('/keystore', { encryptedKeystore: keystore }, this.headers());
  }

  /**
   * Requests encrypted keystore from the server
   *
   * @param userEmail - The email of the user
   * @param keystoreType - The type of the keystore
   * @returns The encrypted keystore
   */
  downloadKeystore(userEmail: string, keystoreType: KeystoreType): Promise<EncryptedKeystore> {
    return this.client.getWithParams('/user/keystore', { userEmail, keystoreType }, this.headers());
  }

  /**
   * Requests users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  getUsersWithPublicKeys(emails: string[]): Promise<RecipientWithPublicKey[]> {
    return this.client.post<{ publicKey: string; email: string }[]>('/users/public-keys', { emails }, this.headers());
  }

  /**
   * Sends the encrypted emails to the server
   *
   * @param emails - The encrypted emails
   * @param params - The public parameters of the email
   * @returns Server response
   */
  sendE2EEmails(emails: HybridEncryptedEmail[], params: EmailPublicParameters): Promise<void> {
    return this.client.post('/emails', { emails, params }, this.headers());
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @param params - The public parameters of the email
   * @returns Server response
   */
  sendE2EPasswordProtectedEmail(email: PwdProtectedEmail, params: EmailPublicParameters): Promise<void> {
    return this.client.post('/emails', { email, params }, this.headers());
  }

  search(filters: SearchFiltersQuery): Promise<EmailListResponse> {
    return this.client.post('/email/search', filters, this.headers());
  }

  /**
   * Gets the mailboxes of the user
   *
   * @returns The mailboxes of the user - `MailboxResponse[]`
   */
  getMailboxes(): Promise<MailboxResponse[]> {
    return this.client.get('/email/mailboxes', this.headers());
  }

  /**
   * Lists emails of the user
   *
   * @param query - The query to filter emails (e.g. mailbox, limit, etc.)
   * @returns The list of emails - `EmailListResponse`
   */
  listEmails(query?: ListEmailsQuery): Promise<EmailListResponse> {
    return this.client.getWithParams('/email', query ?? {}, this.headers());
  }

  /**
   * Gets the email with the corresponding id
   *
   * @param id - The id of the email
   * @returns The email with the corresponding id - `EmailResponse`
   */
  getEmail(id: string): Promise<EmailResponse> {
    return this.client.get(`/email/${id}`, this.headers());
  }

  /**
   * Deletes the email with the corresponding id
   *
   * @param id - The id of the email to delete
   * @returns A promise that resolves when the email is deleted
   */
  deleteEmail(id: string): Promise<void> {
    return this.client.delete(`/email/${id}`, this.headers());
  }

  /**
   * Updates the email with the corresponding id
   *
   * @param id - The id of the email to update
   * @param body - The new body of the email
   * @returns A promise that resolves when the email is updated
   */
  updateEmail(id: string, body: UpdateEmailRequest): Promise<void> {
    return this.client.patch(`/email/${id}`, body, this.headers());
  }

  /**
   * Sends an email to the specified recipients
   *
   * @param body - The body of the email to send
   * @returns The created email
   */
  sendEmail(body: SendEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.post('/email/send', body, this.headers());
  }

  /**
   * Saves a draft email
   *
   * @param body - The body of the draft email to save
   * @returns The created email - `EmailCreatedResponse`
   */
  saveDraft(body: DraftEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.post('/email/drafts', body, this.headers());
  }

  /**
   * Returns the list of active domains for the email gateway
   *
   * @returns The list of active domains - `ActiveDomainsResponse`
   */
  getActiveDomains(): Promise<EmailDomainsResponse> {
    return this.client.get('/email/domains', this.headers());
  }

  /**
   * Sets up a mail account for the user
   *
   * @param payload - Set of details for mail account setup
   * @returns A promise that resolves with the created mail account address
   */
  setupMailAccount(payload: SetupMailAccountPayload): Promise<{ address: string }> {
    return this.client.post('/users/me/mail-account', payload, this.headers());
  }

  /**
   * Gets the mail account keys for the given address
   *
   * @param address - The mail address whose keys should be retrieved
   * @returns The public, encrypted private and recovery keys plus the salt
   */
  getMailAccountKeys(address: string): Promise<MailAccountKeysResponse> {
    return this.client.getWithParams('/users/me/mail-account/keys', { address }, this.headers());
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
