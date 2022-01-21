import { Token } from '../../auth';
import { UnauthorizedCallback } from '../http/types';

export type ApiUrl = string;

export interface AppDetails {
  clientName: string
  clientVersion: string
}

export interface ApiSecurity {
  token: Token
  mnemonic: string,
  unauthorizedCallback?: UnauthorizedCallback
}