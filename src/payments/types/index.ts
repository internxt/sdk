import { UserType } from '../../drive/payments/types/types';

export interface CreateCustomerPayload {
  customerName?: string;
  country: string;
  postalCode?: string;
  captchaToken: string;
  companyVatId?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerWithoutAccountPayload extends CreateCustomerPayload {
  email: string;
  confirmationTokenId: string;
}

export interface CreatedCustomer {
  customerId: string;
  token: string;
}

export interface CreateSubscriptionPayload {
  customerId: string;
  priceId: string;
  token: string;
  captchaToken: string;
  currency?: string;
  promoCodeId?: string;
  gclid?: string;
}

export interface CreatePaymentIntentPayload {
  customerId: string;
  priceId: string;
  token: string;
  currency: string;
  captchaToken: string;
  promoCodeId?: string;
  gclid?: string;
}

export interface PaymentMethodVerificationPayload {
  customerId: string;
  token: string;
  paymentMethod: string;
  priceId: string;
  currency?: string;
}

export interface PaymentMethodVerification {
  intentId: string;
  verified: boolean;
  clientSecret?: string;
}

export interface GetPriceByIdPayload {
  priceId: string;
  promoCodeName?: string;
  userAddress?: string;
  currency?: string;
  postalCode?: string;
  country?: string;
}

export type Price = {
  id: string;
  currency: string;
  amount: number;
  bytes: number;
  interval: 'month' | 'year' | 'lifetime';
  decimalAmount: number;
  type: UserType;
  product: string;
};

export type Taxes = {
  tax: number;
  decimalTax: number;
  amountWithTax: number;
  decimalAmountWithTax: number;
};

export type PriceWithTax = {
  price: Price;
  taxes: Taxes;
};

export interface PaymentIntentFiat {
  id: string;
  type: 'fiat';
  clientSecret: string | null;
  invoiceStatus?: string;
}

export type PaymentIntent = PaymentIntentFiat;
