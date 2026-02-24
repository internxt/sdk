import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { basicHeaders, headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import { CreateCallResponse, JoinCallPayload, JoinCallResponse, UsersInCallResponse } from './types';

export class Meet {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity?: ApiSecurity;

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity?.unauthorizedCallback, apiSecurity?.retryOptions);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    return new Meet(apiUrl, appDetails, apiSecurity);
  }

  async createCall(): Promise<CreateCallResponse> {
    return this.client.post<CreateCallResponse>('call', {}, this.headersWithToken());
  }

  async joinCall(callId: string, payload: JoinCallPayload): Promise<JoinCallResponse> {
    const headers = this.apiSecurity?.token ? this.headersWithToken() : this.basicHeaders();

    return this.client.post<JoinCallResponse>(`call/${callId}/users/join`, { ...payload }, headers);
  }

  async leaveCall(callId: string): Promise<void> {
    const headers = this.apiSecurity?.token ? this.headersWithToken() : this.basicHeaders();

    return this.client.post<void>(`call/${callId}/users/leave`, {}, headers);
  }

  async getCurrentUsersInCall(callId: string): Promise<UsersInCallResponse[]> {
    const headers = this.apiSecurity?.token ? this.headersWithToken() : this.basicHeaders();

    return this.client.get(`call/${callId}/users`, headers);
  }

  private headersWithToken() {
    if (!this.apiSecurity?.token) {
      throw new Error('Token is required for Meet operations');
    }
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: this.apiSecurity.token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }

  private basicHeaders() {
    return basicHeaders({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
