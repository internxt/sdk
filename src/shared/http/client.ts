import axios, { Axios, AxiosError, AxiosResponse, CancelToken, InternalAxiosRequestConfig } from 'axios';
import AppError from '../types/errors';
import { Headers, Parameters, RequestCanceler, URL, UnauthorizedCallback } from './types';

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

export class HttpClient {
  private readonly axios: Axios;
  private readonly unauthorizedCallback: UnauthorizedCallback;
  static globalInterceptors: CustomInterceptor[] = [];

  static setGlobalInterceptors(interceptors: CustomInterceptor[]): void {
    HttpClient.globalInterceptors = interceptors;
  }

  public static create(baseURL: URL, unauthorizedCallback?: UnauthorizedCallback) {
    if (unauthorizedCallback === undefined) {
      unauthorizedCallback = () => null;
    }
    return new HttpClient(baseURL, unauthorizedCallback);
  }

  private constructor(baseURL: URL, unauthorizedCallback: UnauthorizedCallback) {
    this.axios = axios.create({
      baseURL: baseURL,
    });
    this.unauthorizedCallback = unauthorizedCallback;

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

  /**
   * Requests a GET
   * @param url
   * @param headers
   */
  public get<Response>(url: URL, headers: Headers): Promise<Response> {
    return this.axios.get(url, {
      headers: headers,
    });
  }

  /**
   * Requests a GET
   * @param url
   * @param params
   * @param headers
   */
  public getWithParams<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.axios.get(url, {
      params,
      headers,
    });
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
    const cancelTokenSource = axios.CancelToken.source();
    const config: RequestConfig = {
      headers: headers,
      cancelToken: cancelTokenSource.token,
    };
    const promise = this.axios.get<never, Response>(url, config);
    return {
      promise: promise,
      requestCanceler: <RequestCanceler>{
        cancel: cancelTokenSource.cancel,
      },
    };
  }

  /**
   * Requests a POST
   * @param url
   * @param params
   * @param headers
   */
  public post<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.axios.post(url, params, {
      headers: headers,
    });
  }

  /**
   * Requests a POST FORM
   * @param url
   * @param params
   * @param headers
   */
  public postForm<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.axios.postForm(url, params, {
      headers: headers,
    });
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
    const cancelTokenSource = axios.CancelToken.source();
    const config: RequestConfig = {
      headers: headers,
      cancelToken: cancelTokenSource.token,
    };
    const promise = this.axios.post<never, Response>(url, params, config);
    return {
      promise: promise,
      requestCanceler: <RequestCanceler>{
        cancel: cancelTokenSource.cancel,
      },
    };
  }

  /**
   * Requests PATCH
   * @param url
   * @param params
   * @param headers
   */
  public patch<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.axios.patch(url, params, {
      headers: headers,
    });
  }

  /**
   * Requests a PUT
   * @param url
   * @param params
   * @param headers
   */
  public put<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.axios.put(url, params, {
      headers: headers,
    });
  }

  /**
   * Requests a PUT FORM
   * @param url
   * @param params
   * @param headers
   */
  public putForm<Response>(url: URL, params: Parameters, headers: Headers): Promise<Response> {
    return this.axios.putForm(url, params, {
      headers: headers,
    });
  }

  /**
   * Requests a DELETE
   * @param url
   * @param headers
   * @param params
   */
  public delete<Response>(url: URL, headers: Headers, params?: Parameters): Promise<Response> {
    return this.axios.delete(url, {
      headers: headers,
      data: params,
    });
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

interface RequestConfig {
  headers: Headers;
  cancelToken?: CancelToken;
  data?: Record<string, unknown>;
}
