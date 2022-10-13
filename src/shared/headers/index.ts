import { BasicAuth, Token } from '../../auth';

export function basicHeaders(clientName: string, clientVersion: string) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
  };
}

export function basicHeadersWithPassword(clientName: string, clientVersion: string, password: string) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
    'x-share-password': password,
  };
}

export function headersWithToken(clientName: string, clientVersion: string, token: Token) {
  const headers = basicHeaders(clientName, clientVersion);
  const extra = {
    Authorization: 'Bearer ' + token,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithTokenAndMnemonic(clientName: string, clientVersion: string, token: Token, mnemonic: string) {
  const headers = headersWithToken(clientName, clientVersion, token);
  const extra = {
    'internxt-mnemonic': mnemonic,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithTokenAndMnemonicAndPassword(
  clientName: string,
  clientVersion: string,
  token: Token,
  mnemonic: string,
  password: string,
) {
  const headers = headersWithToken(clientName, clientVersion, token);
  const extra = {
    'internxt-mnemonic': mnemonic,
    'x-share-password': password,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithBasicAuth(clientName: string, clientVersion: string, auth: BasicAuth) {
  const headers = basicHeaders(clientName, clientVersion);
  const token = `${auth.username}:${auth.password}`;
  const encodedToken = Buffer.from(token).toString('base64');
  const extra = {
    Authorization: 'Basic ' + encodedToken,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithAuthToken(clientName: string, clientVersion: string, token: string) {
  const headers = basicHeaders(clientName, clientVersion);

  return {
    ...headers,
    'x-token': token,
  };
}
