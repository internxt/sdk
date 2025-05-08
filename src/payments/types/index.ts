import { UserType } from 'src/drive/payments/types/types';

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
  businessSeats?: {
    minimumSeats: number;
    maximumSeats: number;
  };
}
