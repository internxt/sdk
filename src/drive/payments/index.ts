import { ApiModule } from '../../shared/modules';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { getDriveAxiosClient } from '../shared/axios';
import { Axios } from 'axios';
import { headersWithToken } from '../../shared/headers';
import { CreatePaymentSessionPayload, ProductData } from './types';


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
   * Creates and returns a new session identifier for the client to go to payment platform
   * @param payload
   */
  public createSession(payload: CreatePaymentSessionPayload): Promise<{
    id: string
  }> {
    return this.axios
      .post('/v2/stripe/session', {
        test: payload.test,
        lifetime_tier: payload.lifetime_tier,
        mode: payload.mode,
        priceId: payload.priceId,
        successUrl: payload.successUrl,
        canceledUrl: payload.canceledUrl,
      }, {
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