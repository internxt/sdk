import axios, { Axios, AxiosError, AxiosResponse, CancelToken } from 'axios';
import { Headers, URL, RequestCanceler, Parameters } from './types';
import AppError from '../types/errors';

export { RequestCanceler } from './types';

export class HttpClient {
  private readonly axios: Axios;

  public static create(baseURL: URL = '') {
    return new HttpClient(baseURL);
  }

  private constructor(baseURL: URL = '') {
    this.axios = axios.create({
      baseURL: baseURL
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
      headers: headers
    });
  }

  /**
   * Requests a GET with option to cancel
   * @param url
   * @param headers
   */
  public getCancellable<Response>(url: URL, headers: Headers): {
    promise: Promise<Response>,
    requestCanceler: RequestCanceler
  } {
    const cancelTokenSource = axios.CancelToken.source();
    const config: RequestConfig = {
      headers: headers,
      cancelToken: cancelTokenSource.token
    };
    const promise = this.axios.get<never, Response>(url, config);
    return {
      promise: promise,
      requestCanceler: <RequestCanceler>{
        cancel: cancelTokenSource.cancel
      }
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
      headers: headers
    });
  }

  /**
   * Requests a POST with option to cancel
   * @param url
   * @param params
   * @param headers
   */
  public postCancellable<Response>(url: URL, params: Parameters, headers: Headers): {
    promise: Promise<Response>,
    requestCanceler: RequestCanceler
  } {
    const cancelTokenSource = axios.CancelToken.source();
    const config: RequestConfig = {
      headers: headers,
      cancelToken: cancelTokenSource.token
    };
    const promise = this.axios.post<never, Response>(url, params, config);
    return {
      promise: promise,
      requestCanceler: <RequestCanceler>{
        cancel: cancelTokenSource.cancel
      }
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
      headers: headers
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
      headers: headers
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
      data: params
    });
  }

  /**
   * Sets middlewares into the client for common behaviour managing
   * @private
   */
  private initializeMiddleware() {
    this.axios.interceptors.response.use(
      HttpClient.extractData,
      HttpClient.normalizeError
    );
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
  private static normalizeError(error: AxiosError) {
    let errorMessage: string, errorStatus: number;

    if (error.response) {
      const response = error.response as AxiosResponse<{ error: string }>;
      if (response.data.error !== undefined) {
        errorMessage = response.data.error;
      } else {
        // TODO : remove when endpoints of updateMetadata(file/folder) are updated
        // after all clients use th SDK
        errorMessage = String(response.data);
      }
      errorStatus = response.status;
    } else if (error.request) {
      errorMessage = 'Server unavailable';
      errorStatus = 500;
    } else {
      errorMessage = error.message;
      errorStatus = 400;
    }

    throw new AppError(errorMessage, errorStatus);
  }
}

interface RequestConfig {
  headers: Headers
  cancelToken?: CancelToken
  data?: Record<string, unknown>
}
