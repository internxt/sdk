import { BasicAuth, Token } from '../../auth';

export interface CustomHeaders {
  [key: string]: string;
}

type InternxtHeaders = {
  'content-type': string;
  'internxt-version': string;
  'internxt-client': string;
  'x-share-password'?: string;
  Authorization?: string;
  'x-token'?: string;
  'internxt-resources-token'?: string;
};

export function basicHeaders(clientName: string, clientVersion: string): InternxtHeaders {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
  };
}

export function basicHeadersWithPassword(clientName: string, clientVersion: string, password: string): InternxtHeaders {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
    'x-share-password': password,
  };
}

export function headersWithToken(
  clientName: string,
  clientVersion: string,
  token: Token,
  customHeaders?: CustomHeaders,
): InternxtHeaders {
  const headers = basicHeaders(clientName, clientVersion);
  const extra = {
    Authorization: 'Bearer ' + token,
  };
  return {
    ...headers,
    ...extra,
    ...customHeaders,
  };
}

export function headersWithTokenAndPassword(
  clientName: string,
  clientVersion: string,
  token: Token,
  password: string,
): InternxtHeaders {
  const headers = headersWithToken(clientName, clientVersion, token);
  const extra = {
    'x-share-password': password,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithBasicAuth(clientName: string, clientVersion: string, auth: BasicAuth): InternxtHeaders {
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

export function headersWithAuthToken(clientName: string, clientVersion: string, token: Token): InternxtHeaders {
  const headers = basicHeaders(clientName, clientVersion);
  return {
    ...headers,
    'x-token': token,
  };
}

export function addResourcesTokenToHeaders(headers: InternxtHeaders, resourcesToken?: Token): InternxtHeaders {
  if (resourcesToken && resourcesToken.length > 0) {
    return {
      ...headers,
      'internxt-resources-token': resourcesToken,
    };
  }
  return headers;
}
