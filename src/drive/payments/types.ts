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

export interface CreatePaymentSessionPayload {
  test?: boolean;
  lifetime_tier?: LifetimeTier;
  mode: StripeSessionMode;
  priceId: string;
  successUrl?: string;
  canceledUrl?: string;
}

export interface PaymentMethod {
  id: string;
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
}

export type UserSubscription =
  | { type: 'free' | 'lifetime' }
  | {
      type: 'subscription';
      amount: number;
      currency: string;
      amountAfterCoupon?: number;
      interval: 'year' | 'month';
      nextPayment: number;
      priceId: string;
    };

export interface DisplayPrice {
  id: string;
  bytes: number;
  interval: 'year' | 'month' | 'lifetime';
  amount: number;
}

export interface CreateCheckoutSessionPayload {
  price_id: string;
  coupon_code?: string;
  trialDays?: number;
  success_url: string;
  cancel_url: string;
  customer_email: string;
}
