import { ApiUrl } from '../../shared';
import { HttpClient } from '../../shared/http/client';

export interface UserLocation {
  ip: string;
  location: string;
}

export class Location {
  private readonly client: HttpClient;

  private constructor(apiUrl: ApiUrl) {
    this.client = HttpClient.create(apiUrl);
  }

  public static client(apiUrl: ApiUrl) {
    return new Location(apiUrl);
  }

  public async getUserLocation(): Promise<UserLocation> {
    return this.client.get<UserLocation>('', {});
  }
}
