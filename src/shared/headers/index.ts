import { Token } from '../../auth';

export function basicHeaders(clientName: string, clientVersion: string) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName
  };
}

export function headersWithToken(clientName: string, clientVersion: string, token: Token) {
  const headers = basicHeaders(clientName, clientVersion);
  const extra = {
    Authorization: 'Bearer ' + token
  };
  return {
    ...headers,
    ...extra
  };
}

export function headersWithTokenAndMnemonic(clientName: string, clientVersion: string, token: Token, mnemonic: string) {
  const headers = headersWithToken(clientName, clientVersion, token);
  const extra = {
    'internxt-mnemonic': mnemonic
  };
  return {
    ...headers,
    ...extra
  };
}