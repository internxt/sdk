import { Token } from '../../auth';

export type ApiUrl = string;

export interface AppDetails {
  clientName: string
  clientVersion: string
}

export interface ApiSecurity {
  token: Token
  mnemonic: string
}