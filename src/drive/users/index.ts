import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithToken } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { UserSettings } from '../../shared/types/userSettings';
import {
  ChangePasswordPayload,
  CheckChangeEmailExpirationResponse,
  FriendInvite,
  InitializeUserResponse,
  PreCreateUserResponse,
  UpdateProfilePayload,
  UserPublicKeyResponse,
  VerifyEmailChangeResponse,
} from './types';

export * as UserTypes from './types';

export class Users {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Users(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Sends an invitation to the specified email
   * @param email
   */
  public sendInvitation(email: string): Promise<void> {
    return this.client.post(
      '/user/invite',
      {
        email: email,
      },
      this.headers(),
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
        user: InitializeUserResponse;
      }>(
        '/initialize',
        {
          email: email,
          mnemonic: mnemonic,
        },
        this.headers(),
      )
      .then((data) => {
        return data.user;
      });
  }

  /**
   * Returns fresh data of the user
   */
  public refreshUser(): Promise<{
    user: UserSettings;
    token: string;
  }> {
    return this.client.get('/user/refresh', this.headers());
  }

  /**
   * Retrieves the user data for a specific user identified by the uuid.
   *
   * @param {string} params.userUuid - The UUID of the user.
   * @return {Promise<Object>} A promise that resolves to an object containing the user data.
   * The object has the following properties:
   * - `newToken` (string): The new token of the user.
   * - `oldToken` (string): The old drive token of the user.
   * - `user` (UserSettings): The user data.
   */
  public getUserData({ userUuid }: { userUuid: string }): Promise<{
    newToken: string;
    oldToken: string;
    user: UserSettings;
  }> {
    return this.client.get(`/users/c/${userUuid}`, this.headers());
  }

  /**
   * Updates the authentication credentials and invalidates previous tokens
   * @param payload
   *
   * @returns {Promise<{token: string, newToken: string}>} A promise that returns new tokens for this user.
   */
  public changePassword(payload: ChangePasswordPayload): Promise<{ token: string; newToken: string }> {
    return this.client.patch(
      '/users/password',
      {
        currentPassword: payload.currentEncryptedPassword,
        newPassword: payload.newEncryptedPassword,
        newSalt: payload.newEncryptedSalt,
        mnemonic: payload.encryptedMnemonic,
        privateKey: payload.encryptedPrivateKey,
        encryptVersion: payload.encryptVersion,
      },
      this.headers(),
    );
  }

  /**
   * Pre registers an email
   * @param email
   * @returns {Promise<PreCreateUserResponse>} A promise that returns a public key for this user.
   */
  public preRegister(email: string): Promise<PreCreateUserResponse> {
    return this.client.post(
      '/users/pre-create',
      {
        email,
      },
      this.headers(),
    );
  }

  /**
   * Updates a user profile
   * @param payload
   */
  public updateProfile(payload: UpdateProfilePayload) {
    return this.client.patch<void>('/user/profile', payload, this.headers());
  }

  /**
   * Updates a user avatar
   * @param payload
   */
  public updateAvatar(payload: { avatar: Blob }) {
    const formData = new FormData();
    formData.set('avatar', payload.avatar);

    return this.client.put<{ avatar: string }>('/user/avatar', formData, this.headers());
  }

  /**
   * Delete current user avatar
   */
  public deleteAvatar() {
    return this.client.delete<void>('/user/avatar', this.headers());
  }
  /**
   * Gets all friend invites created by this user
   */
  public getFriendInvites(): Promise<FriendInvite[]> {
    return this.client.get('/user/invite', this.headers());
  }

  /**
   * Sends verification email
   */
  public sendVerificationEmail() {
    return this.client.post<void>('/user/sendVerificationEmail', {}, this.headers());
  }

  /**
   * Verifies user email
   */
  public verifyEmail(payload: { verificationToken: string }) {
    return this.client.post<void>('/user/verifyEmail', payload, this.headers());
  }

  /**
   * Change user email by new email
   *
   * @param {string} newEmail
   *
   * @returns {Promise<void>}
   */
  public changeUserEmail(newEmail: string): Promise<void> {
    return this.client.post(
      'users/attempt-change-email',
      {
        newEmail,
      },
      this.headers(),
    );
  }

  /**
   * Verify user email change
   *
   * @param {string} encryptedAttemptChangeEmailId
   *
   * @returns {Promise<VerifyEmailChangeResponse>}
   */
  public verifyEmailChange(encryptedAttemptChangeEmailId: string): Promise<VerifyEmailChangeResponse> {
    return this.client.post(`users/attempt-change-email/${encryptedAttemptChangeEmailId}/accept`, {}, this.headers());
  }

  /**
   * Check if user email change verification link is expired
   *
   * @param {string} encryptedAttemptChangeEmailId
   *
   * @returns {Promise<CheckChangeEmailExpirationResponse>}
   */
  public checkChangeEmailExpiration(
    encryptedAttemptChangeEmailId: string,
  ): Promise<CheckChangeEmailExpirationResponse> {
    return this.client.get(
      `users/attempt-change-email/${encryptedAttemptChangeEmailId}/verify-expiration`,
      this.headers(),
    );
  }

  /**
   * Get public key of given email
   */
  public getPublicKeyByEmail({ email }: { email: string }): Promise<UserPublicKeyResponse> {
    return this.client.get<UserPublicKeyResponse>(`/users/public-key/${email}`, this.headers());
  }

  private headers() {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, this.apiSecurity.token);
  }
}
