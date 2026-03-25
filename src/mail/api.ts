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
  Email,
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
    return this.client.post(`${this.apiUrl}/keystore`, { encryptedKeystore: keystore }, this.headers());
  }

  /**
   * Requests encrypted keystore from the server
   *
   * @param userEmail - The email of the user
   * @param keystoreType - The type of the keystore
   * @returns The encrypted keystore
   */
  async downloadKeystore(userEmail: string, keystoreType: KeystoreType): Promise<EncryptedKeystore> {
    return this.client.getWithParams(`${this.apiUrl}/user/keystore`, { userEmail, keystoreType }, this.headers());
  }

  /**
   * Requests users with corresponding public keys from the server
   *
   * @param emails - The emails of the users
   * @returns Users with corresponding public keys
   */
  async getUsersWithPublicKeys(emails: string[]): Promise<RecipientWithPublicKey[]> {
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
   * @param params - The public parameters of the email
   * @returns Server response
   */
  async sendEmails(emails: HybridEncryptedEmail[], params: EmailPublicParameters): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { emails, params }, this.headers());
  }

  /**
   * Sends the password-protected email to the server
   *
   * @param email - The password-protected email
   * @param params - The public parameters of the email
   * @returns Server response
   */
  async sendPasswordProtectedEmail(email: PwdProtectedEmail, params: EmailPublicParameters): Promise<void> {
    return this.client.post(`${this.apiUrl}/emails`, { email, params }, this.headers());
  }

  async getMails(): Promise<Email[]> {
    return this.client.get(`${this.apiUrl}/emails`, this.headers());
  }

  async getMailboxes(): Promise<MailboxResponse[]> {
    return this.client.get(`${this.apiUrl}/email/mailboxes`, this.headers());
  }

  async listEmails(query?: ListEmailsQuery): Promise<EmailListResponse> {
    return this.client.getWithParams(`${this.apiUrl}/email`, query ?? {}, this.headers());
  }

  async getEmail(id: string): Promise<EmailResponse> {
    return this.client.get(`${this.apiUrl}/email/${id}`, this.headers());
  }

  async deleteEmail(id: string): Promise<void> {
    return this.client.delete(`${this.apiUrl}/email/${id}`, this.headers());
  }

  async updateEmail(id: string, body: UpdateEmailRequest): Promise<void> {
    return this.client.patch(`${this.apiUrl}/email/${id}`, body, this.headers());
  }

  async sendEmail(body: SendEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.post(`${this.apiUrl}/email/send`, body, this.headers());
  }

  async saveDraft(body: DraftEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.post(`${this.apiUrl}/email/drafts`, body, this.headers());
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
