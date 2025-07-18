import { UserType } from '../../drive/payments/types/types';

export interface CreateSubscriptionPayload {
  customerId: string;
  priceId: string;
  token: string;
  currency?: string;
  promoCodeId?: string;
  quantity?: number;
}

export interface CreatePaymentIntentPayload {
  customerId: string;
  priceId: string;
  token: string;
  currency?: string;
  promoCodeId?: string;
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
  interval: 'lifetime' | 'year';
  decimalAmount: number;
  type: UserType;
  product: string;
  minimumSeats?: number;
  maximumSeats?: number;
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
