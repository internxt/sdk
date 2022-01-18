import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  ChangePasswordPayload,
  InitializeUserResponse,
} from './types';
import { UserSettings } from '../../shared/types/userSettings';
import { HttpClient } from '../../shared/http/client';

export * as UserTypes from './types';

export class Users {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Users(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Sends an invitation to the specified email
   * @param email
   */
  public sendInvitation(email: string): Promise<void> {
    return this.client
      .post(
        '/user/invite',
        {
          email: email
        },
        this.headers()
      );
  }

  /**
   * Initialize basic state of user and returns data after registration process
   * @param email
   * @param mnemonic
   */
  public initialize(email: string, mnemonic: string): Promise<InitializeUserResponse> {
    return this.client
      .post<{
        user: InitializeUserResponse
      }>(
        '/initialize',
        {
          email: email,
          mnemonic: mnemonic
        },
        this.headers()
      )
      .then(data => {
        return data.user;
      });
  }

  /**
   * Returns fresh data of the user
   */
  public refreshUser(): Promise<{
    user: UserSettings
    token: string
  }> {
    return this.client
      .get(
        '/user/refresh',
        this.headers()
      );
  }

  /**
   * Updates the authentication credentials
   * @param payload
   */
  public changePassword(payload: ChangePasswordPayload) {
    return this.client
      .patch(
        '/user/password',
        {
          currentPassword: payload.currentEncryptedPassword,
          newPassword: payload.newEncryptedPassword,
          newSalt: payload.newEncryptedSalt,
          mnemonic: payload.encryptedMnemonic,
          privateKey: payload.encryptedPrivateKey,
        },
        this.headers()
      );
  }

  private headers() {
    return headersWithTokenAndMnemonic(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      this.apiSecurity.mnemonic
    );
  }
}