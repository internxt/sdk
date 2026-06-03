import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { headersWithToken } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import { PhotoDevice } from './types';

export class Photos {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Photos(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback, apiSecurity.retryOptions);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  public listDevices(): Promise<PhotoDevice[]> {
    return this.client.get('/photos/devices', this.headers());
  }

  public createDevice(deviceName: string): Promise<PhotoDevice> {
    return this.client.post('/photos/devices', { deviceName }, this.headers());
  }

  public getDevice(uuid: string): Promise<PhotoDevice> {
    return this.client.get(`/photos/devices/${uuid}`, this.headers());
  }

  public deleteDevice(uuid: string): Promise<void> {
    return this.client.delete(`/photos/devices/${uuid}`, this.headers());
  }

  public renameDevice(uuid: string, deviceName: string): Promise<PhotoDevice> {
    return this.client.patch(`/photos/devices/${uuid}`, { deviceName }, this.headers());
  }

  private headers() {
    return headersWithToken({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      token: this.apiSecurity.token,
      workspaceToken: this.apiSecurity.workspaceToken,
      desktopToken: this.appDetails.desktopHeader,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}

export * from './types';
