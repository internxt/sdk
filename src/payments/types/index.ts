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
  currency: string;
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

export interface CryptoCurrency {
  currencyId: string;
  name: string;
  type: 'crypto' | 'fiat';
  receiveType: boolean;
  networks: { platformId: string; name: string }[];
  imageUrl: string;
}

export interface PaymentIntentCrypto {
  id: string;
  type: 'crypto';
  token: string;
  payload: {
    paymentRequestUri: string;
    payAmount: number;
    payCurrency: string;
    paymentAddress: string;
    url: string;
    qrUrl: string;
  };
}

export interface PaymentIntentFiat {
  id: string;
  type: 'fiat';
  clientSecret: string | null;
  invoiceStatus?: string;
}

export type PaymentIntent = PaymentIntentCrypto | PaymentIntentFiat;
