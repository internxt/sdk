import { headersWithToken } from '../../shared/headers';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { ReferralEnabledResponse, ReferralTokenResponse, UserReferral } from './types';
import { HttpClient } from '../../shared/http/client';

export * as ReferralTypes from './types';

export class Referrals {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Referrals(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback, apiSecurity.retryOptions);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Returns a list of referrals of this user
   */
  public getReferrals(): Promise<UserReferral[]> {
    return this.client.get('/users-referrals', this.headers());
  }

  /**
   * Generates a referral token for the authenticated user
   */
  public createReferralToken(): Promise<ReferralTokenResponse> {
    return this.client.post('/referral/token', {}, this.headers());
  }

  /**
   * Checks if the referral feature is enabled for the authenticated user
   */
  public isReferralEnabled(): Promise<ReferralEnabledResponse> {
    return this.client.get('/referral/enabled', this.headers());
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
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
