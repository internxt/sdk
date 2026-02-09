import { BasicAuth, Token } from '../../auth';

export interface CustomHeaders {
  [key: string]: string;
}

export interface BasicHeadersPayload {
  clientName: string;
  clientVersion: string;
  customHeaders?: Record<string, string>;
  desktopToken?: Token;
}

type InternxtHeaders = {
  'content-type': string;
  'internxt-version': string;
  'internxt-client': string;
  'x-share-password'?: string;
  Authorization?: string;
  'x-token'?: string;
  'internxt-resources-token'?: string;
  'x-internxt-desktop-header'?: string;
};

export function basicHeaders({
  clientName,
  clientVersion,
  customHeaders,
  desktopToken,
}: BasicHeadersPayload): InternxtHeaders {
  const extra: ExtraHeaders = {};
  if (desktopToken) {
    extra['x-internxt-desktop-header'] = desktopToken;
  }
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
    ...extra,
    ...customHeaders,
  };
}

export function basicHeadersWithPassword({
  clientName,
  clientVersion,
  password,
  desktopToken,
}: {
  clientName: string;
  clientVersion: string;
  password: string;
  desktopToken?: Token;
}): InternxtHeaders {
  const extra: ExtraHeaders = {};
  if (desktopToken) {
    extra['x-internxt-desktop-header'] = desktopToken;
  }
  return {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
    'x-share-password': password,
    ...extra,
  };
}

type ExtraHeaders = {
  Authorization?: string;
  'x-internxt-workspace'?: Token;
  'x-internxt-desktop-header'?: Token;
};

export function headersWithToken({
  clientName,
  clientVersion,
  token,
  workspaceToken,
  desktopToken,
  customHeaders,
}: {
  clientName: string;
  clientVersion: string;
  token: Token;
  workspaceToken?: Token;
  desktopToken?: Token;
  customHeaders?: CustomHeaders;
}): InternxtHeaders {
  const headers = basicHeaders({ clientName, clientVersion, desktopToken });
  const extra: ExtraHeaders = {
    Authorization: 'Bearer ' + token,
  };
  if (workspaceToken) {
    extra['x-internxt-workspace'] = workspaceToken;
  }
  return {
    ...headers,
    ...extra,
    ...customHeaders,
  };
}

export function headersWithTokenAndPassword({
  clientName,
  clientVersion,
  token,
  workspaceToken,
  desktopToken,
  password,
}: {
  clientName: string;
  clientVersion: string;
  token: Token;
  workspaceToken: Token | undefined;
  desktopToken: Token | undefined;
  password: string;
}): InternxtHeaders {
  const headers = headersWithToken({ clientName, clientVersion, token, workspaceToken, desktopToken });
  const extra = {
    'x-share-password': password,
  };
  return {
    ...headers,
    ...extra,
  };
}

export function headersWithBasicAuth({
  clientName,
  clientVersion,
  auth,
  workspaceToken,
  desktopToken,
  customHeaders,
}: {
  clientName: string;
  clientVersion: string;
  auth: BasicAuth;
  workspaceToken?: Token;
  desktopToken?: Token;
  customHeaders?: CustomHeaders;
}): InternxtHeaders {
  const headers = basicHeaders({ clientName, clientVersion, desktopToken });
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

export function headersWithAuthToken({
  clientName,
  clientVersion,
  token,
  workspaceToken,
  desktopToken,
  customHeaders,
}: {
  clientName: string;
  clientVersion: string;
  token: Token;
  workspaceToken?: Token;
  desktopToken?: Token;
  customHeaders?: CustomHeaders;
}): InternxtHeaders {
  const headers = basicHeaders({ clientName, clientVersion, desktopToken });
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
