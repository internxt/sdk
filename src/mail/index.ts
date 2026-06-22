import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient, RequestCanceler } from '../shared/http/client';
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
  MailAccountResponse,
  LookupRecipientKeysResponse,
  EncryptedKeystore,
  KeystoreType,
  RecipientWithPublicKey,
  HybridEncryptedEmail,
  EmailPublicParameters,
  PwdProtectedEmail,
  UploadAttachmentResponse,
  DownloadAttachmentResponse,
  DownloadAttachmentPayload,
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

  getThreads(parentMessageId: string): Promise<EmailResponse[]> {
    return this.client.get(`/email/threads/${parentMessageId}`, this.headers());
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
   * Looks up the public encryption keys for one or more recipient addresses.
   * For each address, returns the public key if it belongs to an active
   * Internxt domain, or `null` for external or unknown addresses.
   *
   * @param addresses - 1-50 email addresses to look up
   * @returns Recipients with their public keys (or null)
   */
  lookupRecipientKeys(addresses: string[]): Promise<LookupRecipientKeysResponse> {
    return this.client.post('/email/keys/lookup', { addresses }, this.headers());
  }

  /**
   * Saves a draft email
   *
   * @param body - The body of the draft email to save
   * @returns The created email - `EmailResponse`
   */
  saveDraft(body: DraftEmailRequest): Promise<EmailResponse> {
    return this.client.post('/email/drafts', body, this.headers());
  }

  /**
   * Updates the draft with the corresponding id
   *
   * @param id - The id of the draft to update
   * @param body - The new body of the draft
   * @returns The new Draft Id for this email
   */
  updateDraft(id: string, body: DraftEmailRequest): Promise<EmailResponse> {
    return this.client.patch(`/email/drafts/${id}`, body, this.headers());
  }

  /**
   * Gets the draft with the corresponding id
   *
   * @param id - The id of the draft
   * @returns The draft with the corresponding id - `EmailResponse`
   */
  getDraft(id: string): Promise<EmailResponse> {
    return this.client.get(`/email/drafts/${id}`, this.headers());
  }

  /**
   * Discards an existent mail draft
   * @param id - The id of the draft we want to discard
   * @returns A promise that resolves when the draft is discarded
   */
  discardDraft(id: string): Promise<void> {
    return this.client.delete(`/email/drafts/${id}`, this.headers());
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
   * Returns the current mail account for the authenticated user, including its
   * state, default address, and (when suspended) the scheduled deletion time.
   *
   * @returns The mail account details — `MailAccountResponse`
   */
  getMailAccount(): Promise<MailAccountResponse> {
    return this.client.get('/users/me/mail-account', this.headers());
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
   * Gets the mail account keys for the given address. When omitted, the
   * backend returns the keys for the caller's default address.
   *
   * @param address - Optional. The mail address whose keys should be retrieved
   * @returns The public, encrypted private and recovery keys plus the salt
   */
  getMailAccountKeys(address?: string): Promise<MailAccountKeysResponse> {
    const params = address ? { address } : {};
    return this.client.getWithParams('/users/me/mail-account/keys', params, this.headers());
  }

  /**
   * Uploading an attachment to the S3 so we can attach it to an email
   * @param file - File to upload
   * @returns
   *    - `blobId` - The blob id of the attachment
   *    - `name` - The name of the attachment
   *    - `type` - The content type of the attachment
   *    - `size` - The size of the attachment
   *
   */
  uploadAttachment(file: File): {
    promise: Promise<UploadAttachmentResponse>;
    requestCanceler: RequestCanceler;
  } {
    const formData = new FormData();
    formData.append('attachments', file, file.name);

    return this.client.postFormCancellable('/email/attachment', formData, this.headers());
  }

  /**
   * Downloads an attachment of the given email as raw bytes, together with the
   * metadata exposed by the response headers (filename, content type and
   * content length). The caller decides how to consume the bytes (write them
   * to disk, wrap them in a `Blob`, etc.).
   *
   * @param id - The id of the email that owns the attachment
   * @param blobId - The blob id of the attachment
   * @param query - Optional `name` and `type` overrides forwarded to the backend
   * @returns The attachment bytes plus filename, content type and length
   */
  async downloadAttachment(
    id: string,
    blobId: string,
    query: DownloadAttachmentPayload = {},
  ): Promise<DownloadAttachmentResponse> {
    const { data, headers } = await this.client.getBinary(`/email/${id}/attachment/${blobId}`, query, this.headers());

    const contentLengthHeader = headers['content-length'];
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : undefined;

    return {
      data,
      contentType: headers['content-type'] ?? 'application/octet-stream',
      contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
      fileName: parseContentDispositionFilename(headers['content-disposition']),
    };
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

function parseContentDispositionFilename(header: string | undefined): string | undefined {
  if (!header) return undefined;

  const utf8Match = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/i.exec(header);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const asciiMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return asciiMatch ? asciiMatch[1].trim() : undefined;
}
