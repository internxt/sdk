import { AxiosError, AxiosResponse, AxiosStatic } from 'axios';
import AppError from '../types/errors';

export class AppModule {
  protected readonly axios: AxiosStatic;

  constructor(axios: AxiosStatic) {
    axios.interceptors.response.use(undefined, (error: AxiosError): AppError => {
      let errorMessage: string;
      let errorStatus: number;

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
    });
    this.axios = axios;
  }

}