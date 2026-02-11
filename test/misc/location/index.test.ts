import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Location, UserLocation } from '../../../src/misc/location';
import { HttpClient } from '../../../src/shared/http/client';

describe('Location service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Get user location', () => {
    it('should call with right params & return user location', async () => {
      // Arrange
      const mockLocation: UserLocation = {
        ip: '1.1.1.1',
        location: 'ES',
      };
      vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(mockLocation);
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
