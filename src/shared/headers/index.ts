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

export function basicHeaders(
  clientName: string,
  clientVersion: string,
  customHeaders?: Record<string, string>,
): InternxtHeaders {
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
    ...customHeaders,
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

type ExtraHeaders = {
  Authorization?: string;
  'x-internxt-workspace'?: Token;
};

export function headersWithToken(
  clientName: string,
  clientVersion: string,
  token: Token,
  workspaceToken?: Token,
  customHeaders?: CustomHeaders,
): InternxtHeaders {
  const headers = basicHeaders(clientName, clientVersion);
  const extra: ExtraHeaders = {
    Authorization: 'Bearer ' + token,
  };

  if (workspaceToken !== undefined) {
    extra['x-internxt-workspace'] = workspaceToken;
  }
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
  workspaceToken: Token | undefined,
  password: string,
): InternxtHeaders {
  const headers = headersWithToken(clientName, clientVersion, token, workspaceToken);
  const extra = {
    'x-share-password': password,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithBasicAuth(
  clientName: string,
  clientVersion: string,
  auth: BasicAuth,
  workspaceToken?: Token,
  customHeaders?: CustomHeaders,
): InternxtHeaders {
  const headers = basicHeaders(clientName, clientVersion);
  const token = `${auth.username}:${auth.password}`;
  const encodedToken = Buffer.from(token).toString('base64');
  const extra: ExtraHeaders = {
    Authorization: 'Basic ' + encodedToken,
  };
  if (workspaceToken !== undefined) {
    extra['x-internxt-workspace'] = workspaceToken;
  }
  return {
    ...headers,
    ...extra,
    ...customHeaders,
  };
}

export function headersWithAuthToken(
  clientName: string,
  clientVersion: string,
  token: Token,
  workspaceToken?: Token,
  customHeaders?: CustomHeaders,
): InternxtHeaders {
  const headers = basicHeaders(clientName, clientVersion);
  const extra: ExtraHeaders = {};
  if (workspaceToken !== undefined) {
    extra['x-internxt-workspace'] = workspaceToken;
  }

  return {
    ...headers,
    'x-token': token,
    ...extra,
    ...customHeaders,
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
