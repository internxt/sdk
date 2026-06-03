import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Photos } from '../../../src/drive/photos';
import { PhotoDevice } from '../../../src/drive/photos/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';

const existingDevice: PhotoDevice = {
  uuid: 'device-uuid-1',
  plainName: 'Laura iPhone',
  bucket: 'photos-bucket',
  status: 'EXISTS',
};

function clientAndHeaders() {
  const appDetails: AppDetails = { clientName: 'c-name', clientVersion: '0.1' };
  const apiSecurity: ApiSecurity = { token: 'my-token' };
  const client = Photos.client('', appDetails, apiSecurity);
  const headers = headersWithToken({ clientName: 'c-name', clientVersion: '0.1', token: 'my-token' });
  return { client, headers };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('listDevices', () => {
  test('when the server returns a list of devices, then they are parsed and returned', async () => {
    const devices = [existingDevice];
    vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(devices);
    const { client, headers } = clientAndHeaders();

    const result = await client.listDevices();

    expect(result).toEqual(devices);
    expect(HttpClient.prototype.get).toHaveBeenCalledWith('/photos/devices', headers);
  });

  test('when the server throws, then the error is propagated', async () => {
    vi.spyOn(HttpClient.prototype, 'get').mockRejectedValue(new Error('server error'));
    const { client } = clientAndHeaders();

    await expect(client.listDevices()).rejects.toThrow('server error');
  });
});

describe('createDevice', () => {
  test('when a device is created successfully, then the created device is returned', async () => {
    vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(existingDevice);
    const { client, headers } = clientAndHeaders();

    const result = await client.createDevice('Laura iPhone');

    expect(result).toEqual(existingDevice);
    expect(HttpClient.prototype.post).toHaveBeenCalledWith('/photos/devices', { deviceName: 'Laura iPhone' }, headers);
  });

  test('when the server throws, then the error is propagated', async () => {
    vi.spyOn(HttpClient.prototype, 'post').mockRejectedValue(new Error('conflict'));
    const { client } = clientAndHeaders();

    await expect(client.createDevice('Laura iPhone')).rejects.toThrow('conflict');
  });
});

describe('getDevice', () => {
  test('when the device is found, then it is returned', async () => {
    vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(existingDevice);
    const { client, headers } = clientAndHeaders();

    const result = await client.getDevice('device-uuid-1');

    expect(result).toEqual(existingDevice);
    expect(HttpClient.prototype.get).toHaveBeenCalledWith('/photos/devices/device-uuid-1', headers);
  });

  test('when the server throws, then the error is propagated', async () => {
    vi.spyOn(HttpClient.prototype, 'get').mockRejectedValue(new Error('not found'));
    const { client } = clientAndHeaders();

    await expect(client.getDevice('device-uuid-missing')).rejects.toThrow('not found');
  });
});

describe('deleteDevice', () => {
  test('when the device is deleted successfully, then void is returned', async () => {
    vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue(undefined);
    const { client, headers } = clientAndHeaders();

    const result = await client.deleteDevice('device-uuid-1');

    expect(result).toBe(undefined);
    expect(HttpClient.prototype.delete).toHaveBeenCalledWith('/photos/devices/device-uuid-1', headers);
  });

  test('when the server throws, then the error is propagated', async () => {
    vi.spyOn(HttpClient.prototype, 'delete').mockRejectedValue(new Error('server error'));
    const { client } = clientAndHeaders();

    await expect(client.deleteDevice('device-uuid-1')).rejects.toThrow('server error');
  });
});

describe('renameDevice', () => {
  test('when the device is renamed successfully, then the updated device is returned', async () => {
    const updatedDevice: PhotoDevice = { ...existingDevice, plainName: 'New Name' };
    vi.spyOn(HttpClient.prototype, 'patch').mockResolvedValue(updatedDevice);
    const { client, headers } = clientAndHeaders();

    const result = await client.renameDevice('device-uuid-1', 'New Name');

    expect(result).toEqual(updatedDevice);
    expect(HttpClient.prototype.patch).toHaveBeenCalledWith(
      '/photos/devices/device-uuid-1',
      { deviceName: 'New Name' },
      headers,
    );
  });

  test('when the server throws, then the error is propagated', async () => {
    vi.spyOn(HttpClient.prototype, 'patch').mockRejectedValue(new Error('server error'));
    const { client } = clientAndHeaders();

    await expect(client.renameDevice('device-uuid-1', 'New Name')).rejects.toThrow('server error');
  });
});
