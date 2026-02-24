import { Token } from '../../auth';
import { RetryOptions } from '../http/retryWithBackoff';
import { UnauthorizedCallback } from '../http/types';

export type ApiUrl = string;

export interface AppDetails {
  clientName: string;
  clientVersion: string;
  customHeaders?: Record<string, string>;
  desktopHeader?: string;
}

export interface ApiSecurity {
  token: Token;
  workspaceToken?: Token;
  unauthorizedCallback?: UnauthorizedCallback;
  retryOptions?: RetryOptions;
}
