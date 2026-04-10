import { AxiosError, AxiosResponse } from 'axios';

export default class AppError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly headers?: Record<string, string>;
  public readonly requestId?: string;

  constructor(message: string, status?: number, code?: string, headers?: Record<string, string>) {
    super(message);

    this.status = status;
    this.code = code;
    this.headers = headers;
    this.requestId = headers?.['x-request-id'];

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AxiosResponseError extends Error {
  public readonly request: string;
  public readonly data: unknown;
  public readonly status: number;
  public readonly xRequestId: string | undefined;

  constructor(message: string, request: string, response: AxiosResponse) {
    super(message);
    this.request = request;
    this.data = response.data;
    this.status = response.status;
    this.xRequestId = response.headers?.['x-request-id'];
    Object.setPrototypeOf(this, AxiosResponseError.prototype);
  }
}

export class AxiosUnknownError extends Error {
  public readonly request: string;
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, request: string, error: AxiosError) {
    super(message);
    this.request = request;
    this.status = error.request ? 500 : 400;
    this.code = error.code;
    Object.setPrototypeOf(this, AxiosUnknownError.prototype);
  }
}
