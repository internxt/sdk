import { HttpClient } from '../../shared/http/client';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { Device, DeviceBackup } from './types';
import { headersWithToken } from '../../shared/headers';

export class Backups {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Backups(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  public getAllDevices(): Promise<Device[]> {
    return this.client
      .get(
        '/backup/device',
        this.headers()
      );
  }

  public getAllBackups(mac: string): Promise<DeviceBackup[]> {
    return this.client
      .get(
        `/backup/${mac}`,
        this.headers()
      );
  }

  public deleteBackup(backupId: number): Promise<void> {
    return this.client
      .delete(
        `/backup/${backupId}`,
        this.headers()
      );
  }

  public deleteDevice(deviceId: number): Promise<void> {
    return this.client
      .delete(
        `/backup/device/${deviceId}`,
        this.headers()
      );
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token
    );
  }
}

