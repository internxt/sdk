import axios, { AxiosStatic } from 'axios';
import { headersWithTokenAndMnemonic } from '../../shared/headers';
import { AppModule } from '../../shared/modules';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { UserReferral } from './types';

export * as ReferralTypes from './types';

export class Referrals extends AppModule {
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Referrals(axios, apiUrl, appDetails, apiSecurity);
  }

  constructor(axios: AxiosStatic, apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    super(axios, apiUrl);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Returns a list of referrals of this user
   */
  public getReferrals(): Promise<UserReferral[]> {
    return this.axios
      .get('/users-referrals', {
        headers: this.headers()
      })
      .then(response => {
        return response.data;
      });
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithTokenAndMnemonic(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      this.apiSecurity.mnemonic
    );
  }

}