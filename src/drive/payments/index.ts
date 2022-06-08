import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithToken } from '../../shared/headers';
import {
  CreatePaymentSessionPayload,
  DisplayPrice,
  Invoice,
  PaymentMethod,
  ProductData,
  UserSubscription,
} from './types';
import { HttpClient } from '../../shared/http/client';
import AppError from '../../shared/types/errors';

export class Payments {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Payments(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Fetches the existing products and its details
   */
  public getProducts(): Promise<ProductData[]> {
    return this.client.get('/v3/stripe/products', this.headers());
  }

  /**
   * Creates and returns a new session identifier for the client to go to payment platform
   * @param payload
   */
  public createSession(payload: CreatePaymentSessionPayload): Promise<{
    id: string;
  }> {
    return this.client.post(
      '/v2/stripe/session',
      {
        test: payload.test,
        lifetime_tier: payload.lifetime_tier,
        mode: payload.mode,
        priceId: payload.priceId,
        successUrl: payload.successUrl,
        canceledUrl: payload.canceledUrl,
      },
      this.headers(),
    );
  }

  public getSetupIntent(): Promise<{ clientSecret: string }> {
    return this.client.get('/setup-intent', this.headers());
  }

  public getDefaultPaymentMethod(): Promise<PaymentMethod> {
    return this.client.get('/default-payment-method', this.headers());
  }

  public getInvoices({ startingAfter, limit }: { startingAfter?: string; limit?: number }): Promise<Invoice[]> {
    const query = new URLSearchParams();
    if (startingAfter !== undefined) query.set('starting_after', startingAfter);
    if (limit !== undefined) query.set('limit', limit.toString());

    return this.client.get(`/invoices?${query.toString()}`, this.headers());
  }

  public getUserSubscription(): Promise<UserSubscription> {
    return this.client.get<UserSubscription>('/subscriptions', this.headers()).catch((err) => {
      const error = err as AppError;

      if (error.status === 404) return { type: 'free' };
      else throw err;
    });
  }

  public getPrices(): Promise<DisplayPrice[]> {
    return this.client.get<DisplayPrice[]>('/prices', this.headers());
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, this.apiSecurity.token);
  }
}
