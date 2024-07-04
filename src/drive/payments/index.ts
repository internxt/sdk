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
  UpdateSubscriptionPaymentMethod,
  UserType,
  InvoicePayload,
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

  public getSetupIntent(userType?: UserType): Promise<{ clientSecret: string }> {
    const query = new URLSearchParams();
    if (userType) query.set('userType', userType);
    return this.client.get(`/setup-intent?${query.toString()}`, this.headers());
  }

  public getDefaultPaymentMethod(userType?: UserType): Promise<PaymentMethod> {
    const query = new URLSearchParams();
    if (userType) query.set('userType', userType);
    return this.client.get(`/default-payment-method?${query.toString()}`, this.headers());
  }

  public getInvoices({ subscriptionId, startingAfter, limit }: InvoicePayload): Promise<Invoice[]> {
    const query = new URLSearchParams();
    if (subscriptionId) query.set('subscription', subscriptionId);
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

  public getUserSubscription(userType?: UserType): Promise<UserSubscription> {
    const query = new URLSearchParams();
    if (userType) query.set('userType', userType);
    return this.client.get<UserSubscription>(`/subscriptions?${query.toString()}`, this.headers()).catch((err) => {
      const error = err as AppError;

      if (error.status === 404) return { type: 'free' };
      else throw err;
    });
  }

  public async getPrices(currency?: string, userType?: UserType): Promise<DisplayPrice[]> {
    const query = new URLSearchParams();
    if (currency !== undefined) query.set('currency', currency);
    if (userType) query.set('userType', userType);
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

  public updateSubscriptionPaymentMethod(payload: UpdateSubscriptionPaymentMethod): Promise<void | Error> {
    return this.client.post('/subscriptions/update-payment-method', { ...payload }, this.headers());
  }

  public updateSubscriptionPrice(
    priceId: string,
    couponCode?: string,
  ): Promise<{ userSubscription: UserSubscription; request3DSecure: boolean; clientSecret: string }> {
    return this.client.put('/subscriptions', { price_id: priceId, couponCode: couponCode }, this.headers());
  }

  public cancelSubscription(userType?: UserType): Promise<void> {
    const query = new URLSearchParams();
    if (userType) query.set('userType', userType);
    return this.client.delete(`/subscriptions?${query.toString()}`, this.headers());
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
