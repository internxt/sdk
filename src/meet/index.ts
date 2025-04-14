import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import { CreateCallResponse, JoinCallPayload, JoinCallResponse, UsersInCallResponse } from './types';

export class Meet {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity?: ApiSecurity;

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity?.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    return new Meet(apiUrl, appDetails, apiSecurity);
  }

  async createCall(): Promise<CreateCallResponse> {
    return this.client.post<CreateCallResponse>('call', {}, this.headers());
  }

  async joinCall(callId: string, payload: JoinCallPayload): Promise<JoinCallResponse> {
    return this.client.post<JoinCallResponse>(`call/${callId}/users/join`, { ...payload }, this.headers());
  }

  getCurrentUsersInCall(callId: string): Promise<UsersInCallResponse[]> {
    return this.client.get(`call/${callId}/users`, this.headers());
  }

  private headers() {
    if (!this.apiSecurity?.token) {
      throw new Error('Token is required for Meet operations');
    }
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, this.apiSecurity.token);
  }
}
