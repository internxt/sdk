import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithToken } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import AppError from '../../shared/types/errors';
import { Tier } from './types/tiers';
import {
  AvailableProducts,
  CreateCheckoutSessionPayload,
  CreatedSubscriptionData,
  CreatePaymentSessionPayload,
  CustomerBillingInfo,
  DisplayPrice,
  FreeTrialAvailable,
  Invoice,
  InvoicePayload,
  PaymentMethod,
  ProductData,
  RedeemCodePayload,
  UpdateSubscriptionPaymentMethod,
  UserSubscription,
  UserType,
} from './types/types';

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

  public createCustomer(
    name: string,
    email: string,
    country?: string,
    companyVatId?: string,
  ): Promise<{ customerId: string; token: string }> {
    return this.client.post('/create-customer', { name, email, country, companyVatId }, this.headers());
  }

  public createSubscription(
    customerId: string,
    priceId: string,
    token: string,
    quantity: number,
    currency?: string,
    promoCodeId?: string,
  ): Promise<CreatedSubscriptionData> {
    return this.client.post(
      '/create-subscription',
      {
        customerId,
        priceId,
        token,
        quantity,
        currency,
        promoCodeId,
      },
      this.headers(),
    );
  }

  public createPaymentIntent(
    customerId: string,
    amount: number,
    planId: string,
    token: string,
    currency?: string,
    promoCodeName?: string,
  ): Promise<{ clientSecret: string; id: string; invoiceStatus?: string }> {
    const query = new URLSearchParams();
    query.set('customerId', customerId);
    query.set('amount', String(amount));
    query.set('planId', planId);
    query.set('token', token);
    if (currency !== undefined) query.set('currency', currency);
    if (promoCodeName !== undefined) query.set('promoCodeName', promoCodeName);
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

  public getInvoices({
    subscriptionId,
    userType = UserType.Individual,
    startingAfter,
    limit,
  }: InvoicePayload): Promise<Invoice[]> {
    const query = new URLSearchParams();
    if (subscriptionId !== undefined) query.set('subscription', subscriptionId);
    if (startingAfter !== undefined) query.set('starting_after', startingAfter);
    if (userType !== undefined) query.set('userType', userType);
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

  public getPromoCodesUsedByUser(): Promise<{ usedCoupons: string[] }> {
    return this.client.get('/customer/redeemed-promotion-codes', this.headers());
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

  public updateSubscriptionPrice({
    priceId,
    couponCode,
    userType,
  }: {
    priceId: string;
    couponCode?: string;
    userType: UserType;
  }): Promise<{ userSubscription: UserSubscription; request3DSecure: boolean; clientSecret: string }> {
    return this.client.put('/subscriptions', { price_id: priceId, couponCode: couponCode, userType }, this.headers());
  }

  public updateWorkspaceMembers(workspaceId: string, subscriptionId: string, updatedSeats: number) {
    return this.client.patch(
      '/business/subscription',
      {
        workspaceId,
        subscriptionId,
        workspaceUpdatedSeats: updatedSeats,
      },
      this.headers(),
    );
  }

  public cancelSubscription(userType?: UserType): Promise<void> {
    const query = new URLSearchParams();
    if (userType) query.set('userType', userType);
    return this.client.delete(`/subscriptions?${query.toString()}`, this.headers());
  }

  public createCheckoutSession(payload: CreateCheckoutSessionPayload): Promise<{ sessionId: string }> {
    return this.client.post('/checkout-session', { ...payload }, this.headers());
  }

  public updateCustomerBillingInfo(payload: CustomerBillingInfo): Promise<void> {
    return this.client.patch('/billing', { ...payload }, this.headers());
  }

  /**
   * Gets the available products from the user
   * @returns an object containing available products
   */
  public checkUserAvailableProducts(): Promise<AvailableProducts> {
    return this.client.get('/products', this.headers());
  }

  /**
   * Gets product information based on the user's subscription tier.
   *
   * @param {UserType} [userType] - The type of user for which to query product information.
   *                               If not specified, UserType.Individual will be used by default.
   * @returns {Promise<Tier>} A promise that resolves with the product information
   *                         available for the specified tier.
   *
   * @example
   * // Get products for an individual user tier (default)
   * const individualProducts = await getUserTier();
   *
   * @example
   * // Get products for a business user tier
   * const businessProducts = await getUserTier(UserType.Business);
   */
  public getUserTier(userType?: UserType): Promise<Tier> {
    const query = new URLSearchParams();
    if (userType !== undefined) query.set('tierType', userType);
    return this.client.get<Tier>(`/products/tier?${query.toString()}`, this.headers());
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
