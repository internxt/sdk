import { HttpClient } from '../../../src/shared/http/client';
import sinon from 'sinon';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { testHeadersWithToken } from '../../shared/headers';
import { Backups } from '../../../src/drive/backups';

const httpClient = HttpClient.create();

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
        `/api/backup/${mac}`,
        headers
      ]);
      expect(body).toEqual({
        backups: 'some'
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
  const headers = testHeadersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
