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
}

export interface Price {
  id: string;
  currency: string;
  amount: number;
  bytes: number;
  interval: 'year' | 'lifetime';
  decimalAmount: number;
  type: UserType;
  tax: number;
  decimalTax: number;
  amountWithTax: number;
  decimalAmountWithTax: number;
  product: string;
  businessSeats?: {
    minimumSeats: number;
    maximumSeats: number;
  };
}
