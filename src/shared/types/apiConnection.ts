import { Token } from '../../auth';

export interface ApiPublicConnectionDetails {
  url: string
  clientName: string
  clientVersion: string
}

export interface ApiSecureConnectionDetails extends ApiPublicConnectionDetails {
  token: Token
  mnemonic: string
}