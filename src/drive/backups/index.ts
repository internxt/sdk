import { HttpClient } from '../../shared/http/client';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { Device, DeviceBackup } from './types';
import { headersWithToken } from '../../shared/headers';
import { DriveFolderData } from '../storage/types';

export class Backups {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Backups(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * @deprecated Use 'getBackupDevices' instead. 
   * This method uses the old drive backend, while 'getBackupDevices' uses the new drive backend.
   */
  public getAllDevices(): Promise<Device[]> {
    return this.client
      .get(
        '/backup/device',
        this.headers()
      );
  }

  /**
   * Retrieves the list of backup devices associated with the user's account.
   *
   * @returns {Promise<Device[]>} A promise that resolves to an array of Devices.
   */
  public getBackupDevices(): Promise<Device[]> {
    return this.client
      .get(
        '/backup/devices',
        this.headers()
      );
  }

  /**
   * Retrieves a list of all devices represented as folders.
   *
   * This method sends a GET request to the `/backup/deviceAsFolder` endpoint
   * and returns an array of `DriveFolderData` objects, each representing a device
   * as a folder in the drive.
   *
   * @returns {Promise<DriveFolderData[]>} A promise that resolves to an array of DriveFolderData.
   */
  public getAllDevicesAsFolder(): Promise<DriveFolderData[]> {
    return this.client
      .get(
        '/backup/deviceAsFolder',
        this.headers()
      );
  }

  /**
   * Retrieves all backups associated with a specific device identified by its mac ID.
   *
   * @param mac - The mac ID of the device for which backups are to be retrieved.
   * @returns A promise that resolves to an array of DeviceBackups.
   */
  public getAllBackups(mac: string): Promise<DeviceBackup[]> {
    return this.client
      .get(
        `/backup/${mac}`,
        this.headers()
      );
  }

  /**
   * Deletes a backup by its ID.
   *
   * @param backupId - The unique identifier of the backup to be deleted.
   * @returns A promise that resolves when the backup is successfully deleted.
   */
  public deleteBackup(backupId: number): Promise<void> {
    return this.client
      .delete(
        `/backup/${backupId}`,
        this.headers()
      );
  }

  /**
   * @deprecated Use 'deleteBackupDevice' instead.
   * This method uses the old drive backend, while 'deleteBackupDevice' uses the new drive backend.
   */
  public deleteDevice(deviceId: number): Promise<void> {
    return this.client
      .delete(
        `/backup/device/${deviceId}`,
        this.headers()
      );
  }

  /**
   * Deletes a backup device by its ID.
   *
   * @param deviceId - The unique identifier of the device to be deleted.
   * @returns A promise that resolves when the device is successfully deleted.
   */
  public deleteBackupDevice(deviceId: number): Promise<void> {
    return this.client
      .delete(
        `/backup/devices/${deviceId}`,
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

