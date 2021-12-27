import { Token } from '../../auth';

export function basicHeaders(clientName: string, clientVersion: string) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName
  };
}

export function headersWithToken(clientName: string, clientVersion: string, token: Token) {
  const headers = basicHeaders(clientName, clientVersion), extra = {
    Authorization: 'Bearer ' + token
  };
  return {
    ...headers,
    ...extra
  };
}