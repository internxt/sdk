import { paths } from '../../schema';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { basicHeaders, headersWithToken } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { UserSettings } from '../../shared/types/userSettings';
import {
  ChangePasswordPayload,
  ChangePasswordPayloadNew,
  CheckChangeEmailExpirationResponse,
  FriendInvite,
  InitializeUserResponse,
  PreCreateUserResponse,
  Token,
  UpdateProfilePayload,
  UserPublicKeyResponse,
  UserPublicKeyWithCreationResponse,
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
    this.client = HttpClient.create(apiUrl, apiSecurity?.unauthorizedCallback);
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
  public refreshUser(): Promise<paths['/users/refresh']['get']['responses']['200']['content']['application/json']> {
    return this.client.get('/users/refresh', this.headers());
  }

  /**
   * Returns fresh avatar URL of the user
   */
  public refreshAvatarUser(): Promise<{
    avatar: UserSettings['avatar'];
  }> {
    return this.client.get('/users/avatar/refresh', this.headers());
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
   * Updates the authentication credentials and invalidates previous tokens (Legacy backend (drive-server))
   * @param payload
   *
   * @returns {Promise<{token: string, newToken: string}>} A promise that returns new tokens for this user.
   */
  public changePasswordLegacy(payload: ChangePasswordPayload): Promise<{ token: string; newToken: string }> {
    return this.client.patch(
      '/user/password',
      {
        currentPassword: payload.currentEncryptedPassword,
        newPassword: payload.newEncryptedPassword,
        newSalt: payload.newEncryptedSalt,
        mnemonic: payload.encryptedMnemonic,
        privateKey: payload.encryptedPrivateKey,
      },
      this.headers(),
    );
  }

  /**
   * Updates the authentication credentials and invalidates previous tokens (New backend (drive-server-wip))
   * @param payload
   *
   * @returns {Promise<{token: string, newToken: string}>} A promise that returns new tokens for this user.
   */
  public changePassword(payload: ChangePasswordPayloadNew): Promise<{ token: string; newToken: string }> {
    return this.client.patch(
      '/users/password',
      {
        currentPassword: payload.currentEncryptedPassword,
        newPassword: payload.newEncryptedPassword,
        newSalt: payload.newEncryptedSalt,
        mnemonic: payload.encryptedMnemonic,
        privateKey: payload.keys.encryptedPrivateKey,
        privateKyberKey: payload.keys.encryptedPrivateKyberKey,
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
   * @deprecated Use `updateUserProfile` instead.
   * Updates a user profile
   * @param payload
   */
  public updateProfile(payload: UpdateProfilePayload) {
    return this.client.patch<void>('/user/profile', payload, this.headers());
  }

  /**
   * Updates a user profile
   * @param payload
   */
  public updateUserProfile(payload: UpdateProfilePayload, token?: Token) {
    return this.client.patch<void>(
      '/users/profile',
      payload,
      this.headersWithToken(token ?? <string>this.apiSecurity?.token),
    );
  }

  /**
   * @deprecated Use `updateUserAvatar` instead.
   * Updates a user avatar
   * @param payload
   */
  public updateAvatar(payload: { avatar: Blob }) {
    return this.client.putForm<{ avatar: string }>(
      '/user/avatar',
      {
        avatar: payload.avatar,
      },
      this.headers(),
    );
  }

  /**
   * Updates a user avatar
   * @param payload
   */
  public async updateUserAvatar(payload: { avatar: Blob }, token?: Token) {
    return this.client.putForm<{ avatar: string }>(
      '/users/avatar',
      {
        avatar: payload.avatar,
      },
      this.headersWithToken(token ?? this.apiSecurity?.token),
    );
  }

  /**
   * @deprecated Use `deleteUserAvatar` instead.
   * Delete current user avatar
   */
  public deleteAvatar() {
    return this.client.delete<void>('/user/avatar', this.headers());
  }

  /**
   * Delete current user avatar
   */
  public deleteUserAvatar(token?: Token) {
    return this.client.delete<void>('/users/avatar', this.headersWithToken(token ?? <string>this.apiSecurity?.token));
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
  public sendVerificationEmail(token?: Token) {
    return this.client.post<void>(
      '/users/email-verification/send',
      {},
      this.headersWithToken(token ?? <string>this.apiSecurity?.token),
    );
  }

  /**
   * Verifies user email
   */
  public verifyEmail(payload: { verificationToken: string }) {
    return this.client.post<void>('/users/email-verification', payload, this.headers());
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

  /**
   * Get public key of given email, if not exists it pre-create user with this email
   * and returns public key
   * @param email
   * @returns {Promise<UserPublicKeyWithCreationResponse>} A promise that returns the public keys of given user
   */
  public getPublicKeyWithPrecreation({ email }: { email: string }): Promise<UserPublicKeyWithCreationResponse> {
    return this.client.put<UserPublicKeyWithCreationResponse>(`/users/public-key/${email}`, {}, this.headers());
  }

  /**
   * Generate mnemonic
   */
  public generateMnemonic(): Promise<{ mnemonic: string }> {
    return this.client.get<{ mnemonic: string }>('/users/generate-mnemonic', this.basicHeaders());
  }

  private basicHeaders() {
    return basicHeaders({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }

  private headers() {
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: this.apiSecurity.token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }

  private headersWithToken(token: Token) {
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
