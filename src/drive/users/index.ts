import axios, { AxiosStatic } from 'axios';
import { ApiSecureConnectionDetails } from '../../shared/types/apiConnection';

export class Users {
  private readonly axios: AxiosStatic;
  private readonly apiDetails: ApiSecureConnectionDetails;

  public static client(apiDetails: ApiSecureConnectionDetails) {
    return new Users(axios, apiDetails);
  }

  constructor(axios: AxiosStatic, apiDetails: ApiSecureConnectionDetails) {
    this.axios = axios;
    this.apiDetails = apiDetails;
  }


}