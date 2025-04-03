import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import { CreateCallResponse } from './types';

export class Meet {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity?: ApiSecurity;

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity?.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  private headers() {
    if (!this.apiSecurity?.token) {
      throw new Error('Token is required for Meet operations');
    }
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, this.apiSecurity.token);
  }

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    return new Meet(apiUrl, appDetails, apiSecurity);
  }

  async createMeetCall(): Promise<CreateCallResponse> {
    const meet = await this.client.post<CreateCallResponse>('call', {}, this.headers());
    return meet;
  }
}
