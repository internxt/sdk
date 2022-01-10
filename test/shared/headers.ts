import { Token } from '../../src';

export function testBasicHeaders(clientName: string, clientVersion: string) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName
  };
}

export function testHeadersWithToken(clientName: string, clientVersion: string, token: Token) {
  const headers = testBasicHeaders(clientName, clientVersion);
  const extra = {
    Authorization: 'Bearer ' + token
  };
  return {
    ...headers,
    ...extra
  };
}

export function testHeadersWithTokenAndMnemonic(
  clientName: string, clientVersion: string, token: Token, mnemonic: string
) {
  const headers = testHeadersWithToken(clientName, clientVersion, token);
  const extra = {
    'internxt-mnemonic': mnemonic
  };
  return {
    ...headers,
    ...extra
  };
}