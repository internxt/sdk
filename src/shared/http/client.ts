import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AppError from '../types/errors';
import { Headers, Parameters, RequestCanceler, URL, UnauthorizedCallback } from './types';
import { RetryOptions, retryWithBackoff } from './retryWithBackoff';

export { RequestCanceler } from './types';

export interface CustomInterceptor {
  request?: {
    onFulfilled?: (
      config: InternalAxiosRequestConfig,
    ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
    onRejected?: (error: unknown) => unknown;
  };
  response?: {
    onFulfilled?: (response: AxiosResponse) => AxiosResponse;
    onRejected?: (error: unknown) => unknown;
  };
}

type NonZero<N extends number> = N extends 0 ? never : N;

type GlobalRetryOptions<M extends number = number> = Omit<RetryOptions, 'maxRetries'> & {
  maxRetries?: NonZero<M>;
};

export class HttpClient {
  private readonly axios: AxiosInstance;
  private readonly unauthorizedCallback: UnauthorizedCallback;
  private retryOptions?: RetryOptions;
  static globalInterceptors: CustomInterceptor[] = [];
  static globalRetryOptions?: RetryOptions;

  static setGlobalInterceptors(interceptors: CustomInterceptor[]): void {
    HttpClient.globalInterceptors = interceptors;
  }

  /**
   * Enables global retry with backoff for rate limit errors (429) across every HttpClient instance.
   * @param [options] - Optional retry configuration options
   * @param [options.maxRetries] - Maximum number of retry attempts (default: 5)
   * @param [options.maxRetryAfter] - Maximum wait time in ms regardless of retry-after header value (default: 70000)
   * @param [options.onRetry] - Callback invoked before each retry with the attempt number and delay in ms
   */
  static enableGlobalRetry<M extends number = number>(options?: GlobalRetryOptions<M>): void {
    HttpClient.globalRetryOptions = (options ?? {}) as RetryOptions;
  }

  public static create(baseURL: URL, unauthorizedCallback?: UnauthorizedCallback, retryOptions?: RetryOptions) {
    if (unauthorizedCallback === undefined) {
      unauthorizedCallback = () => null;
    }
    return new HttpClient(baseURL, unauthorizedCallback, retryOptions);
  }

  private constructor(baseURL: URL, unauthorizedCallback: UnauthorizedCallback, retryOptions?: RetryOptions) {
    this.axios = axios.create({
      baseURL: baseURL,
    });
    this.unauthorizedCallback = unauthorizedCallback;
    this.retryOptions = retryOptions;

    HttpClient.globalInterceptors.forEach((interceptor) => {
      if (interceptor.request) {
        this.axios.interceptors.request.use(interceptor.request.onFulfilled, interceptor.request.onRejected);
      }
      if (interceptor.response) {
        this.axios.interceptors.response.use(interceptor.response.onFulfilled, interceptor.response.onRejected);
      }
    });

    this.initializeMiddleware();
  }

  private execute<T>(fn: () => Promise<T>): Promise<T> {
    const options = this.retryOptions ?? HttpClient.globalRetryOptions;
    if (!options) {
      return fn();
    }
    return retryWithBackoff(fn, options);
  }

  /**
   * Requests a GET
   * @param url
   * @param headers
   */
  public get<Response>(url: URL, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.get(url, { headers }));
  }

  /**
   * Requests a GET
   * @param url
   * @param params
   * @param headers
   */
  public getWithParams<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.get(url, { params, headers }));
  }

  /**
   * Requests a GET with option to cancel
   * @param url
   * @param headers
   */
  public getCancellable<Response>(
    url: URL,
    headers: Headers,
  ): {
    promise: Promise<Response>;
    requestCanceler: RequestCanceler;
  } {
    let currentCancel: RequestCanceler['cancel'] = () => {};
    const requestCanceler: RequestCanceler = { cancel: (message) => currentCancel(message) };

    const promise = this.execute(() => {
      const source = axios.CancelToken.source();
      currentCancel = source.cancel;
      return this.axios.get<never, Response>(url, { headers, cancelToken: source.token });
    });

    return { promise, requestCanceler };
  }

  /**
   * Requests a POST
   * @param url
   * @param params
   * @param headers
   */
  public post<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.post(url, params, { headers }));
  }

  /**
   * Requests a POST FORM
   * @param url
   * @param params
   * @param headers
   */
  public postForm<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.postForm(url, params, { headers }));
  }

  /**
   * Requests a POST with option to cancel
   * @param url
   * @param params
   * @param headers
   */
  public postCancellable<Response>(
    url: URL,
    params: Parameters,
    headers: Headers,
  ): {
    promise: Promise<Response>;
    requestCanceler: RequestCanceler;
  } {
    let currentCancel: RequestCanceler['cancel'] = () => {};
    const requestCanceler: RequestCanceler = { cancel: (message) => currentCancel(message) };

    const promise = this.execute(() => {
      const source = axios.CancelToken.source();
      currentCancel = source.cancel;
      return this.axios.post<never, Response>(url, params, { headers, cancelToken: source.token });
    });

    return { promise, requestCanceler };
  }

  /**
   * Requests PATCH
   * @param url
   * @param params
   * @param headers
   */
  public patch<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.patch(url, params, { headers }));
  }

  /**
   * Requests a PUT
   * @param url
   * @param params
   * @param headers
   */
  public put<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.put(url, params, { headers }));
  }

  /**
   * Requests a PUT FORM
   * @param url
   * @param params
   * @param headers
   */
  public putForm<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.execute(() => this.axios.putForm(url, params, { headers }));
  }

  /**
   * Requests a DELETE
   * @param url
   * @param headers
   * @param params
   */
  public delete<Response>(url: URL, headers: Headers, params?: Parameters): Promise<Response> {
    return this.execute(() => this.axios.delete(url, { headers, data: params }));
  }

  /**
   * Sets middlewares into the client for common behaviour managing
   * @private
   */
  private initializeMiddleware() {
    this.axios.interceptors.response.use(HttpClient.extractData, this.normalizeError.bind(this));
  }

  /**
   * Extracts the valuable data from the server's response
   * @param response
   * @private
   */
  private static extractData(response: AxiosResponse) {
    return response.data;
  }

  /**
   * Converts the specific client error into a proprietary error for our apps
   * @param error
   * @private
   */
  private normalizeError(error: AxiosError) {
    let errorMessage: string,
      errorStatus: number,
      errorCode: string | undefined,
      errorHeaders: Record<string, string> | undefined;

    if (error.response) {
      const response = error.response as AxiosResponse<{
        error: string;
        message: string;
        statusCode: number;
        code?: string;
      }>;
      if (response.status === 401) {
        this.unauthorizedCallback();
      }
      errorMessage = response.data.message || response.data.error || JSON.stringify(response.data);
      errorStatus = response.status;
      errorCode = response.data.code;
      errorHeaders = response.headers as Record<string, string>;
    } else if (error.request) {
      errorMessage = 'Server unavailable';
      errorStatus = 500;
    } else {
      errorMessage = error.message;
      errorStatus = 400;
    }

    throw new AppError(errorMessage, errorStatus, errorCode, errorHeaders);
  }
}
