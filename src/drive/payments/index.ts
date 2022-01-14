import { ApiModule } from '../../shared/modules';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { getDriveAxiosClient } from '../shared/axios';
import { Axios } from 'axios';
import { headersWithToken } from '../../shared/headers';
import { ProductData } from './types';


export class Payments extends ApiModule {
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    const axios = getDriveAxiosClient(apiUrl);
    return new Payments(axios, appDetails, apiSecurity);
  }

  private constructor(axios: Axios, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    super(axios);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Fetches the existing products and its details
   */
  public getProducts(): Promise<ProductData[]> {
    return this.axios
      .get('/v3/stripe/products', {
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
    return headersWithToken(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token
    );
  }

}