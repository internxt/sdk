import { UserType } from 'src/drive/payments/types/types';

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

export interface GetPriceByIdPayload {
  priceId: string;
  promoCodeName?: string;
  currency?: string;
  postalCode?: string;
  country?: string;
}

type Price = {
  id: string;
  currency: string;
  amount: number;
  bytes: number;
  interval: 'lifetime' | 'year';
  decimalAmount: number;
  type: UserType;
  product: string;
  businessSeats?: {
    minimumSeats: number;
    maximumSeats: number;
  };
};

type Taxes = {
  tax: number;
  decimalTax: number;
  amountWithTax: number;
  decimalAmountWithTax: number;
};

export type PriceWithTax = {
  price: Price;
  taxes: Taxes;
};
