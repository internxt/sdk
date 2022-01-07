import { AxiosError, AxiosResponse, AxiosStatic } from 'axios';
import AppError from '../types/errors';

export class AppModule {
  protected readonly axios: AxiosStatic;

  constructor(axios: AxiosStatic) {
    axios.interceptors.response.use(undefined, (error: AxiosError): AppError => {
      let errorMessage: string;
      let errorStatus: number;
      const serverUnavailable = !!error.request;
      const isServerError = !!error.response;

      if (serverUnavailable) {
        errorMessage = 'Server unavailable';
        errorStatus = 500;
      } else if (isServerError) {
        const response = error.response as AxiosResponse<{ error: string }>;
        errorMessage = response.data.error;
        errorStatus = response.status;
      } else {
        errorMessage = error.message;
        errorStatus = 400;
      }

      throw new AppError(errorMessage, errorStatus);
    });
    this.axios = axios;
  }

}