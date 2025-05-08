import { CreatedSubscriptionData } from 'src/drive/payments/types/types';
import { ApiSecurity, ApiUrl, AppDetails } from 'src/shared';
import { basicHeaders, headersWithToken } from 'src/shared/headers';
import { HttpClient } from 'src/shared/http/client';
import { Price } from './types';

export class Checkout {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Checkout(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * @description Creates a customer or gets the existing one if it already exists
   * @param country - The country of the customer (optional)
   * @param companyVatId - The VAT ID of the company (optional)
   * @returns The customer ID and the user token used to create a subscription or payment intent
   */
  public createCustomer({ country, companyVatId }: { country?: string; companyVatId?: string }): Promise<{
    customerId: string;
    token: string;
  }> {
    const query = new URLSearchParams();
    if (country !== undefined) query.set('country', country);
    if (companyVatId !== undefined) query.set('companyVatId', companyVatId);
    return this.client.get(`/checkout/customer?${query.toString()}`, this.authHeaders());
  }

  /**
   * @description Creates a subscription for a given customer
   * @param customerId - The ID of the customer
   * @param priceId - The ID of the price
   * @param token - The token used to authenticate the customer
   * @param currency - The currency of the subscription (optional)
   * @param promoCodeId - The ID of the promo code (optional)
   * @param quantity - The quantity of the subscription (optional)
   * @returns The created subscription data:
   * - `type`: The type of the subscription (setup or payment)
   * - `clientSecret`: The client secret for the subscription to be used with Stripe Elements
   * - `subscriptionId`: The ID of the subscription (optional)
   * - `paymentIntentId`: The ID of the payment intent (optional)
   */
  public createSubscription({
    customerId,
    priceId,
    token,
    currency,
    promoCodeId,
    quantity,
  }: {
    customerId: string;
    priceId: string;
    token: string;
    currency?: string;
    promoCodeId?: string;
    quantity?: number;
  }): Promise<CreatedSubscriptionData> {
    return this.client.post(
      '/checkout/subscription',
      {
        customerId,
        priceId,
        token,
        currency,
        promoCodeId,
        quantity,
      },
      this.authHeaders(),
    );
  }

  /**
   * @description Fetch a requested price by its ID and its tax rate
   * @param priceId - The ID of the price
   * @param currency - The currency of the price (optional)
   * @returns The price object containing the details of the requested price
   */
  public getPriceById({ priceId, currency }: { priceId: string; currency?: string }): Promise<Price> {
    const query = new URLSearchParams();
    query.set('priceId', priceId);
    if (currency !== undefined) query.set('currency', currency);
    return this.client.get<Price>(`/checkout/price-by-id?${query.toString()}`, this.headers());
  }

  /**
   * Returns the needed headers with authorization header for the module requests
   * @private
   */
  private authHeaders() {
    const additionalHeaders: Record<string, string> = {};

    if (this.appDetails.desktopHeader) {
      additionalHeaders['x-internxt-desktop-header'] = this.appDetails.desktopHeader;
    }

    return headersWithToken(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      undefined,
      additionalHeaders,
    );
  }

  /**
   * Returns the basic needed headers for the module requests
   * @private
   */
  private headers() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }
}
