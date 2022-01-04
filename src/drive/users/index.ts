import axios, { AxiosStatic } from 'axios';
import { ApiSecureConnectionDetails } from '../../shared';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { UserReferral } from './types';

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

  private headers() {
    return headersWithTokenAndMnemonic(
      this.apiDetails.clientName,
      this.apiDetails.clientVersion,
      this.apiDetails.token,
      this.apiDetails.mnemonic
    );
  }
}