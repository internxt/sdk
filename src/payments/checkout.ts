import { CreatedSubscriptionData } from '../drive/payments/types/types';
import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { basicHeaders, headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  CreateCustomerPayload,
  CreatePaymentIntentPayload,
  CreateSubscriptionPayload,
  CryptoCurrency,
  GetPriceByIdPayload,
  PaymentIntent,
  PriceWithTax,
} from './types';

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
   * @param customerName - The name of the customer
   * @param lineAddress1 - The address of the user
   * @param lineAddress2 - The address of the user
   * @param postalCode - The postal code of the city where the user lives
   * @param city - The city of the user
   * @param country - The country of the customer
   * @param postalCode - The postal code of the customer
   * @param captchaToken - The captcha token to verify the call
   * @param companyVatId - The VAT ID of the company (optional)
   * @returns The customer ID and the user token used to create a subscription or payment intent
   */
  public createCustomer({
    customerName,
    lineAddress1,
    lineAddress2,
    postalCode,
    city,
    country,
    captchaToken,
    companyVatId,
  }: CreateCustomerPayload): Promise<{
    customerId: string;
    token: string;
  }> {
    return this.client.post(
      '/checkout/customer',
      {
        customerName,
        city,
        lineAddress1,
        lineAddress2,
        country,
        postalCode,
        captchaToken,
        companyVatId,
      },
      this.authHeaders(),
    );
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
    captchaToken,
    promoCodeId,
    quantity,
  }: CreateSubscriptionPayload): Promise<CreatedSubscriptionData> {
    return this.client.post(
      '/checkout/subscription',
      {
        customerId,
        priceId,
        token,
        currency,
        captchaToken,
        promoCodeId,
        quantity,
      },
      this.authHeaders(),
    );
  }

  /**
   * @description Creates a payment intent for a given customer
   * @param customerId - The ID of the customer
   * @param priceId - The ID of the price
   * @param token - The token used to authenticate the customer
   * @param currency - The currency of the payment intent (optional)
   * @param promoCodeId - The ID of the promo code (optional)
   * @returns The created invoice data:
   * - `clientSecret`: The client secret for the invoice to be used with Stripe Elements
   * - `id`: The ID of the invoice
   * - `invoiceStatus`: The status of the invoice (only when the status is 'paid')
   * - `type`: The type of the currency - 'fiat' or 'crypto'
   * - `payload`: The payload of the invoice if the type is 'crypto' containing { paymentRequestUri, url, qrUrl }
   * - `payload.paymentRequestUri`: The payment request URI for the invoice
   * - `payload.url`: The URL of the invoice
   * - `payload.qrUrl`: The QR code URL of the invoice
   */
  public createPaymentIntent({
    customerId,
    priceId,
    token,
    currency,
    captchaToken,
    userAddress,
    promoCodeId,
  }: CreatePaymentIntentPayload): Promise<PaymentIntent> {
    return this.client.post(
      '/checkout/payment-intent',
      {
        customerId,
        priceId,
        token,
        currency,
        captchaToken,
        userAddress,
        promoCodeId,
      },
      this.authHeaders(),
    );
  }

  /**
   * @description Fetch a requested price by its ID and its tax rate
   * @param priceId - The ID of the price
   * @param promoCodeName - The name of the promo code (optional)
   * @param currency - The currency of the price (optional)
   * @returns The price object containing the details of the requested price
   */
  public getPriceById({
    priceId,
    promoCodeName,
    userAddress,
    currency,
    postalCode,
    country,
  }: GetPriceByIdPayload): Promise<PriceWithTax> {
    const query = new URLSearchParams();
    query.set('priceId', priceId);
    if (promoCodeName !== undefined) query.set('promoCodeName', promoCodeName);
    if (userAddress !== undefined) query.set('userAddress', userAddress);
    if (currency !== undefined) query.set('currency', currency);
    if (postalCode !== undefined) query.set('postalCode', postalCode);
    if (country !== undefined) query.set('country', country);
    return this.client.get<PriceWithTax>(`/checkout/price-by-id?${query.toString()}`, this.headers());
  }

  /**
   * @description Fetches all available cryptocurrencies for the checkout module
   * @returns A promise which resolves to an array of available cryptocurrencies
   */
  public getAvailableCryptoCurrencies(): Promise<CryptoCurrency[]> {
    return this.client.get<CryptoCurrency[]>('/checkout/crypto/currencies', this.headers());
  }

  /**
   * @description Verifies a cryptocurrency payment
   * @param token - The encoded token we need to verify the payment
   * @returns A promise that resolves to a boolean indicating whether the payment is verified
   */
  public verifyCryptoPayment(token: string): Promise<boolean> {
    return this.client.post<boolean>(
      '/checkout/crypto/verify/payment',
      {
        token,
      },
      this.authHeaders(),
    );
  }

  /**
   * Returns the needed headers with authorization header for the module requests
   * @private
   */
  private authHeaders() {
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: this.apiSecurity.token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
    });
  }

  /**
   * Returns the basic needed headers for the module requests
   * @private
   */
  private headers() {
    const customHeaders: Record<string, string> = {
      ...(this.appDetails.customHeaders ?? {}),
    };
    return basicHeaders({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      customHeaders,
    });
  }
}
