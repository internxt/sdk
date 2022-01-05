import axios, { AxiosStatic } from 'axios';
import { ApiSecureConnectionDetails } from '../../shared';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  ChangePasswordPayload,
  FetchLimitResponse,
  InitializeUserResponse,
  UsageResponse,
  UserReferral
} from './types';
import { UserSettings } from '../../shared/types/userSettings';
import AppError from '../../shared/types/errors';

export * as UserTypes from './types';

export class Users {
  private readonly axios: AxiosStatic;
  private readonly apiDetails: ApiSecureConnectionDetails;

  public static client(apiDetails: ApiSecureConnectionDetails) {
    return new Users(axios, apiDetails);
  }

  constructor(axios: AxiosStatic, apiDetails: ApiSecureConnectionDetails) {
    this.axios = axios;
    this.apiDetails = apiDetails;
  }

  /**
   * Sends an invitation to the specified email
   * @param email
   */
  public sendInvitation(email: string): Promise<void> {
    return this.axios
      .post(`${this.apiDetails.url}/api/user/invite`, {
        email: email
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns a list of referrals of this user
   */
  public getReferrals(): Promise<UserReferral[]> {
    return this.axios
      .get(`${this.apiDetails.url}/api/users-referrals`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Initialize basic state of user and returns data after registration process
   * @param email
   * @param mnemonic
   */
  public initialize(email: string, mnemonic: string): Promise<InitializeUserResponse> {
    return this.axios
      .post(`${this.apiDetails.url}/api/initialize`, {
          email: email,
          mnemonic: mnemonic
        },
        {
          headers: this.headers()
        })
      .then(response => {
        return response.data.user;
      });
  }

  /**
   * Returns fresh data of the user
   */
  public refreshUser(): Promise<{
    user: UserSettings
    token: string
  }> {
    return this.axios
      .get(`${this.apiDetails.url}/api/user/refresh`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Updates the authentication credentials
   * @param payload
   */
  public changePassword(payload: ChangePasswordPayload) {
    return this.axios
      .patch(`${this.apiDetails.url}/api/user/password`, {
        currentPassword: payload.currentEncryptedPassword,
        newPassword: payload.newEncryptedPassword,
        newSalt: payload.newEncryptedSalt,
        mnemonic: payload.encryptedMnemonic,
        privateKey: payload.encryptedPrivateKey,
      }, {
        headers: this.headers()
      })
      .then(response => {
        if (response.status === 500) {
          throw new AppError('WRONG_PASSWORD', response.status);
        } else if (response.status !== 200) {
          throw new AppError(response.data.error, response.status);
        }
        return response.data;
      });
  }

  /**
   * Returns the current space usage of the user
   */
  public spaceUsage(): Promise<UsageResponse> {
    return this.axios
      .get(`${this.apiDetails.url}/api/usage`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns the current space limit for the user
   */
  public spaceLimit(): Promise<FetchLimitResponse> {
    return this.axios
      .get(`${this.apiDetails.url}/api/limit`, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  private headers() {
    return headersWithTokenAndMnemonic(
      this.apiDetails.clientName,
      this.apiDetails.clientVersion,
      this.apiDetails.token,
      this.apiDetails.mnemonic
    );
  }
}