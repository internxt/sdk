import { ApiUrl, AppDetails } from '../../shared';
import { basicHeaders } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { CreatedSubscriptionData } from './types';

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
    priceId !== undefined && query.set('planId', priceId);
    currency !== undefined && query.set('currency', currency);
    return this.client.get(`/object-storage-plan-by-id?${query.toString()}`, this.headers());
  }

  public createCustomerForObjectStorage(
    name: string,
    email: string,
    country?: string,
    companyVatId?: string,
  ): Promise<{ customerId: string; token: string }> {
    return this.client.post(
      '/create-customer-for-object-storage',
      {
        name,
        email,
        country,
        companyVatId,
      },
      this.headers(),
    );
  }

  public getPaymentIntentForObjectStorage(
    customerId: string,
    plan: ObjectStoragePlan,
    token: string,
  ): Promise<{ clientSecret: string }> {
    const query = new URLSearchParams();
    query.set('customerId', customerId);
    query.set('planId', plan.id);
    query.set('token', token);
    query.set('currency', plan.currency);
    query.set('amount', plan.amount.toString());
    return this.client.get(
      `/payment-intent-for-object-storage?${query.toString()}`,

      this.headers(),
    );
  }

  public createObjectStorageSubscription(
    customerId: string,
    plan: ObjectStoragePlan,
    token: string,
    companyName: string,
    vatId: string,
    promoCodeId?: string,
  ): Promise<CreatedSubscriptionData> {
    const { id: priceId, currency } = plan;

    return this.client.post(
      '/create-subscription-for-object-storage',
      {
        customerId,
        priceId,
        token,
        currency,
        companyName,
        companyVatId: vatId,
        promoCodeId,
      },
      this.headers(),
    );
  }

  private headers() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }
}
