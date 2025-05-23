import { PaymentMethodVerification, PaymentMethodVerificationPayload } from 'src/payments/types';
import { ApiUrl, AppDetails } from '../../shared';
import { basicHeaders } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { CreatedSubscriptionData } from './types/types';

interface ObjectStoragePlan {
  id: string;
  bytes: number;
  interval: 'year' | 'month' | 'lifetime';
  amount: number;
  currency: string;
  decimalAmount: number;
}

export class ObjectStorage {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails) {
    return new ObjectStorage(apiUrl, appDetails);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails) {
    this.client = HttpClient.create(apiUrl);
    this.appDetails = appDetails;
  }

  public getObjectStoragePlanById(priceId: string, currency?: string): Promise<ObjectStoragePlan> {
    const query = new URLSearchParams();
    query.set('planId', priceId);
    currency !== undefined && query.set('currency', currency);
    return this.client.get(`/object-storage/price?${query.toString()}`, this.headers());
  }

  public getObjectStorageCustomerId({
    customerName,
    email,
    country,
    postalCode,
    companyVatId,
  }: {
    customerName: string;
    email: string;
    country: string;
    postalCode: string;
    companyVatId?: string;
  }): Promise<{ customerId: string; token: string }> {
    const query = new URLSearchParams();
    query.set('customerName', customerName);
    query.set('email', email);
    query.set('postalCode', postalCode);
    query.set('country', country);
    companyVatId !== undefined && query.set('companyVatId', companyVatId);

    return this.client.get(
      `/object-storage/customer?${query.toString()}`,

      this.headers(),
    );
  }

  public createObjectStorageSubscription({
    customerId,
    priceId,
    currency,
    token,

    promoCodeId,
  }: {
    customerId: string;
    priceId: string;
    currency: string;
    token: string;
    promoCodeId?: string;
  }): Promise<CreatedSubscriptionData> {
    return this.client.post(
      '/object-storage/subscription',
      {
        customerId,
        priceId,
        currency,
        token,
        promoCodeId,
      },
      this.headers(),
    );
  }

  public paymentMethodVerification({
    customerId,
    token,
    currency = 'eur',
    paymentMethod,
  }: PaymentMethodVerificationPayload): Promise<PaymentMethodVerification> {
    return this.client.post(
      '/payment-method-verification',
      {
        customerId,
        token,
        currency,
        paymentMethod,
      },
      this.headers(),
    );
  }

  private headers() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }
}
