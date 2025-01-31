import { AppSumoDetails } from './../../shared/types/appsumo';
export interface ProductData {
  id: string;
  name: string;
  metadata: ProductMetadata;
  price: ProductPriceData;
  renewalPeriod: RenewalPeriod;
}

export interface ProductMetadata {
  is_drive: boolean;
  is_teams: boolean;
  show: boolean;
  lifetime_tier: LifetimeTier;
  member_tier: keyof typeof StripeMemberTiers;
  simple_name: keyof typeof RenewalPeriod;
  size_bytes: string;
}

export interface ProductPriceData {
  id: string;
  name: string | null;
  amount: number;
  monthlyAmount: number;
  type: ProductPriceType;
  currency: string;
  recurring: ProductPriceRecurringData | null;
}

export interface ProductPriceRecurringData {
  aggregate_usage: string | null;
  interval: string;
  interval_count: number;
  trial_period_days: number;
  usage_type: string;
}

export enum RenewalPeriod {
  Monthly = 'monthly',
  Annually = 'annually',
  Lifetime = 'lifetime',
}

export enum LifetimeTier {
  Lifetime = 'lifetime',
  Exclusive = 'exclusive-lifetime',
  Infinite = 'infinite',
}

export enum StripeSessionMode {
  Payment = 'payment',
  Setup = 'setup',
  Subscription = 'subscription',
}

export enum StripeMemberTiers {
  'infinite',
  'lifetime',
  'premium',
}

export enum ProductPriceType {
  Recurring = 'recurring',
  OneTime = 'one_time',
}

export enum UserType {
  Individual = 'individual',
  Business = 'business',
}

export type StoragePlan = {
  planId: string;
  productId: string;
  name: string;
  simpleName: string;
  paymentInterval: RenewalPeriod;
  price: number;
  monthlyPrice: number;
  currency: string;
  isTeam: boolean;
  isLifetime: boolean;
  renewalPeriod: RenewalPeriod;
  storageLimit: number;
  amountOfSeats: number;
  isAppSumo?: boolean;
  details?: AppSumoDetails;
  seats?: {
    minimumSeats: number;
    maximumSeats: number;
  };
};

export interface CreatePaymentSessionPayload {
  test?: boolean;
  lifetime_tier?: LifetimeTier;
  mode: StripeSessionMode;
  priceId: string;
  successUrl?: string;
  canceledUrl?: string;
}

export interface StripeAddress {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  // TODO: Change this as camelCase
  postal_code: string | null;
  state: string | null;
}

export interface PaymentMethod {
  id: string;
  // TODO: Change this as camelCase
  billing_details?: {
    address: StripeAddress | null;
    email: string | null;
    name: string | null;
    phone: string | null;
  };
  card: {
    brand: 'amex' | 'diners' | 'discover' | 'jcb' | 'mastercard' | 'unionpay' | 'visa' | 'unknown';
    exp_month: number;
    exp_year: number;
    last4: string;
  };
  created: number;
}

export interface Invoice {
  id: string;
  created: number;
  bytesInPlan: number;
  pdf: string;
  total: number;
  currency: string;
}

export interface InvoicePayload {
  subscriptionId?: string;
  startingAfter?: string;
  userType?: UserType;
  limit?: number;
}

export type UserSubscription =
  | { type: 'free' | 'lifetime' }
  | {
      type: 'subscription';
      subscriptionId: string;
      amount: number;
      currency: string;
      amountAfterCoupon?: number;
      interval: 'year' | 'month';
      nextPayment: number;
      priceId: string;
      userType?: UserType;
      planId?: string;
      plan?: StoragePlan;
    };

export interface DisplayPrice {
  id: string;
  bytes: number;
  interval: 'year' | 'month' | 'lifetime';
  amount: number;
  currency: string;
  userType: UserType;
}

export interface CreateCheckoutSessionPayload {
  price_id: string;
  coupon_code?: string;
  trial_days?: number;
  success_url: string;
  cancel_url: string;
  customer_email: string;
  currency?: string;
}

export interface FreeTrialAvailable {
  elegible: boolean;
}

export interface RedeemCodePayload {
  code: string;
  provider: string;
}

export interface UpdateSubscriptionPaymentMethod {
  userType: UserType;
  paymentMethodId: string;
}

export interface CustomerBillingInfo {
  address?: string;
  phoneNumber?: string;
}

export type CreatedSubscriptionData = {
  type: 'setup' | 'payment';
  clientSecret: string;
  subscriptionId?: string;
  paymentIntentId?: string;
};

export type AvailableProducts = {
  featuresPerService: {
    antivirus: boolean;
  };
};
