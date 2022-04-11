import { HttpClient } from '../../../src/shared/http/client';
import sinon from 'sinon';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { Backups } from '../../../src/drive/backups';

const httpClient = HttpClient.create('');

describe('backups service', () => {

  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get all devices', () => {

    it('should call with right params & return data', async () => {
      // Arrange
      const {client, headers} = clientAndHeadersWithToken();
      const callStub = sinon.stub(httpClient, 'get').resolves({
        devices: 'some'
      });

      // Act
      const body = await client.getAllDevices();

      // Assert
      expect(callStub.firstCall.args).toEqual([
        '/backup/device',
        headers
      ]);
      expect(body).toEqual({
        devices: 'some'
      });
    });

  });

  describe('get all backups', () => {

    it('should call with right params & return data', async () => {
      // Arrange
      const {client, headers} = clientAndHeadersWithToken();
      const callStub = sinon.stub(httpClient, 'get').resolves({
        backups: 'some'
      });
      const mac = 'lololo';

      // Act
      const body = await client.getAllBackups(mac);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/backup/${mac}`,
        headers
      ]);
      expect(body).toEqual({
        backups: 'some'
      });
    });

  });

  describe('delete backup', () => {

    it('should call with right params & return data', async () => {
      // Arrange
      const {client, headers} = clientAndHeadersWithToken();
      const callStub = sinon.stub(httpClient, 'delete').resolves({
        done: true
      });
      const backupId = 1;

      // Act
      const body = await client.deleteBackup(backupId);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/backup/${backupId}`,
        headers
      ]);
      expect(body).toEqual({
        done: true
      });
    });

  });

  describe('delete device', () => {

    it('should call with right params & return data', async () => {
      // Arrange
      const {client, headers} = clientAndHeadersWithToken();
      const callStub = sinon.stub(httpClient, 'delete').resolves({
        done: true
      });
      const deviceId = 1;

      // Act
      const body = await client.deleteDevice(deviceId);

      // Assert
      expect(callStub.firstCall.args).toEqual([
        `/backup/device/${deviceId}`,
        headers
      ]);
      expect(body).toEqual({
        done: true
      });
    });

  });

});

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token'
): {
  client: Backups,
  headers: object
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
    mnemonic: '',
  };
  const client = Backups.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
