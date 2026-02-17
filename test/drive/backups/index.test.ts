import { HttpClient } from '../../../src/shared/http/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { Backups } from '../../../src/drive/backups';

describe('backups service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('get all devices', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        devices: 'some',
      });

      // Act
      const body = await client.getAllDevices();

      // Assert
      expect(callStub).toHaveBeenCalledWith('/backup/device', headers);
      expect(body).toEqual({
        devices: 'some',
      });
    });
  });

  describe('get all backups', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const callStub = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({
        backups: 'some',
      });
      const mac = 'lololo';

      // Act
      const body = await client.getAllBackups(mac);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`/backup/${mac}`, headers);
      expect(body).toEqual({
        backups: 'some',
      });
    });
  });

  describe('delete backup', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({
        done: true,
      });
      const backupId = 1;

      // Act
      const body = await client.deleteBackup(backupId);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`/backup/${backupId}`, headers);
      expect(body).toEqual({
        done: true,
      });
    });
  });

  describe('delete device', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({
        done: true,
      });
      const deviceId = 1;

      // Act
      const body = await client.deleteDevice(deviceId);

      // Assert
      expect(callStub).toHaveBeenCalledWith(`/backup/device/${deviceId}`, headers);
      expect(body).toEqual({
        done: true,
      });
    });
  });
});

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
): {
  client: Backups;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Backups.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}
