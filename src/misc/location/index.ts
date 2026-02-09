import { basicHeaders } from '../../shared/headers';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { HttpClient } from '../../shared/http/client';

export interface UserLocation {
  ip: string;
  location: string;
}

export class Location {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity?.unauthorizedCallback);
    this.appDetails = appDetails;
  }

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity?: ApiSecurity) {
    return new Location(apiUrl, appDetails, apiSecurity);
  }

  public async getUserLocation(): Promise<UserLocation> {
    return this.client.get<UserLocation>('', this.basicUserHeaders());
  }

  private basicUserHeaders() {
    return basicHeaders({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
