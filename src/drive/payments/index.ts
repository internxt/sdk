import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithToken } from '../../shared/headers';
import {
  CreateCheckoutSessionPayload,
  CreatePaymentSessionPayload,
  DisplayPrice,
  Invoice,
  PaymentMethod,
  ProductData,
  UserSubscription,
  FreeTrialAvailable,
  RedeemCodePayload,
  CreatedSubscriptionData,
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

  private createCustomer(name: string, email: string): Promise<{ customerId: string }> {
    return this.client.post('/create-customer', { name, email }, this.headers());
  }

  public getCustomerId(name: string, email: string): Promise<{ customerId: string }> {
    const query = new URLSearchParams();
    if (email !== undefined) query.set('email', email);
    return this.client
      .get<{ customerId: string }>(`/get-customer-id?${query.toString()}`, this.headers())
      .catch((err) => {
        const error = err as AppError;
        if (error.status === 404) {
          return this.createCustomer(name, email);
        } else {
          throw error;
        }
      });
  }

  public createSubscription(
    customerId: string,
    priceId: string,
    promoCodeId?: string,
  ): Promise<CreatedSubscriptionData> {
    return this.client.post(
      '/create-subscription',
      {
        customerId,
        priceId,
        promoCodeId,
      },
      this.headers(),
    );
  }

  public createPaymentIntent(
    customerId: string,
    amount: number,
    planId: string,
    promoCodeId?: string,
  ): Promise<{ clientSecret: string }> {
    const query = new URLSearchParams();
    if (customerId !== undefined) query.set('customerId', customerId);
    if (amount !== undefined) query.set('amount', String(amount));
    if (planId !== undefined) query.set('planId', planId);
    if (promoCodeId !== undefined) query.set('promoCodeId', promoCodeId);
    return this.client.get(`/payment-intent?${query.toString()}`, this.headers());
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

  public isCouponUsedByUser({ couponCode }: { couponCode: string }): Promise<{
    couponUsed: boolean;
  }> {
    const query = new URLSearchParams();
    if (couponCode !== undefined) query.set('code', couponCode);

    return this.client.get(`/coupon-in-use?${query.toString()}`, this.headers());
  }

  public getUserSubscription(): Promise<UserSubscription> {
    return this.client.get<UserSubscription>('/subscriptions', this.headers()).catch((err) => {
      const error = err as AppError;

      if (error.status === 404) return { type: 'free' };
      else throw err;
    });
  }

  public async getPrices(currency?: string): Promise<DisplayPrice[]> {
    const query = new URLSearchParams();
    if (currency !== undefined) query.set('currency', currency);
    return this.client.get<DisplayPrice[]>(`/prices?${query.toString()}`, this.headers());
  }

  public requestPreventCancellation(): Promise<FreeTrialAvailable> {
    return this.client.get('/request-prevent-cancellation', this.headers());
  }

  public preventCancellation(): Promise<void> {
    return this.client.put('/prevent-cancellation', {}, this.headers());
  }

  public applyRedeemCode(payload: RedeemCodePayload): Promise<void> {
    return this.client.post('/licenses', { code: payload.code, provider: payload.provider }, this.headers());
  }

  public updateSubscriptionPrice(
    priceId: string,
    couponCode?: string,
  ): Promise<{ userSubscription: UserSubscription; request3DSecure: boolean; clientSecret: string }> {
    return this.client.put('/subscriptions', { price_id: priceId, couponCode: couponCode }, this.headers());
  }

  public cancelSubscription(): Promise<void> {
    return this.client.delete('/subscriptions', this.headers());
  }

  public createCheckoutSession(payload: CreateCheckoutSessionPayload): Promise<{ sessionId: string }> {
    return this.client.post('/checkout-session', { ...payload }, this.headers());
  }

  public getPaypalSetupIntent({
    priceId,
    coupon,
  }: {
    priceId: string;
    coupon?: string;
  }): Promise<{ client_secret: string }> {
    const query = new URLSearchParams();
    if (priceId !== undefined) query.set('priceId', priceId);
    if (coupon !== undefined) query.set('coupon', coupon);

    return this.client.get(`/paypal-setup-intent?${query.toString()}`, this.headers());
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, this.apiSecurity.token);
  }
}
