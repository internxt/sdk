import axios, { AxiosStatic } from 'axios';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import {
  ChangePasswordPayload,
  FetchLimitResponse,
  InitializeUserResponse,
  UsageResponse,
} from './types';
import { UserSettings } from '../../shared/types/userSettings';
import { AppModule } from '../../shared/modules';

export * as UserTypes from './types';

export class Users extends AppModule {
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Users(axios, apiUrl, appDetails, apiSecurity);
  }

  constructor(axios: AxiosStatic, apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    super(axios, apiUrl);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Sends an invitation to the specified email
   * @param email
   */
  public sendInvitation(email: string): Promise<void> {
    return this.axios
      .post('/user/invite', {
        email: email
      }, {
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
      .post('/initialize', {
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
      .get('/user/refresh', {
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
      .patch('/user/password', {
        currentPassword: payload.currentEncryptedPassword,
        newPassword: payload.newEncryptedPassword,
        newSalt: payload.newEncryptedSalt,
        mnemonic: payload.encryptedMnemonic,
        privateKey: payload.encryptedPrivateKey,
      }, {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns the current space usage of the user
   */
  public spaceUsage(): Promise<UsageResponse> {
    return this.axios
      .get('/usage', {
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
      .get('/limit', {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
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