import sinon from 'sinon';
import { Location, UserLocation } from '../../../src/misc/location';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('Location service', () => {
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
      sinon.stub(httpClient, 'get').resolves(mockLocation);
      const { client } = clientAndHeaders();

      // Act
      const result = await client.getUserLocation();

      // Assert
      expect(result).toEqual(mockLocation);
    });
  });
});

function clientAndHeaders({
  apiUrl = '',
}: {
  apiUrl?: string;
} = {}): {
  client: Location;
} {
  const client = Location.client(apiUrl);

  return { client };
}
