import sinon from 'sinon';
import { AppDetails } from '../../../src/shared';
import { basicHeaders } from '../../../src/shared/headers';
import { Location, UserLocation } from '../../../src/misc/location';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('location service', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Get user location', () => {
    it('should call with right params & return user location', async () => {
      // Arrange
      const mockLocation: UserLocation = {
        ip: '1.1.1.1',
        location: 'ES',
      };
      const callStub = sinon.stub(httpClient, 'get').resolves(mockLocation);
      const { client, headers } = clientAndHeaders();

      // Act
      const result = await client.getUserLocation();

      // Assert
      expect(callStub.firstCall.args).toEqual(['', headers]);
      expect(result).toEqual(mockLocation);
    });

    it('should include desktop header when provided', async () => {
      // Arrange
      const mockLocation: UserLocation = {
        ip: '10.0.0.1',
        location: 'US',
      };
      const callStub = sinon.stub(httpClient, 'get').resolves(mockLocation);
      const { client, headers } = clientAndHeaders({
        desktopHeader: 'desktop-token',
      });

      // Act
      const result = await client.getUserLocation();

      // Assert
      expect(callStub.firstCall.args).toEqual(['', headers]);
      expect(result).toEqual(mockLocation);
    });

    it('should include custom headers when provided', async () => {
      // Arrange
      const mockLocation: UserLocation = {
        ip: '172.16.0.1',
        location: 'FR',
      };
      const customHeaders = { 'x-custom-header': 'custom-value' };
      const callStub = sinon.stub(httpClient, 'get').resolves(mockLocation);
      const { client, headers } = clientAndHeaders({
        customHeaders,
      });

      // Act
      const result = await client.getUserLocation();

      // Assert
      expect(callStub.firstCall.args).toEqual(['', headers]);
      expect(result).toEqual(mockLocation);
    });
  });
});

function clientAndHeaders({
  apiUrl = '',
  clientName = 'internxt-client',
  clientVersion = '0.1',
  desktopHeader,
  customHeaders,
}: {
  apiUrl?: string;
  clientName?: string;
  clientVersion?: string;
  desktopHeader?: string;
  customHeaders?: Record<string, string>;
} = {}): {
  client: Location;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName,
    clientVersion,
    desktopHeader,
    customHeaders,
  };

  const client = Location.client(apiUrl, appDetails);
  const headers = basicHeaders({
    clientName,
    clientVersion,
    desktopToken: desktopHeader,
    customHeaders,
  });
  return { client, headers };
}
