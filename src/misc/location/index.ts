import { basicHeaders, BasicHeadersPayload } from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';

export interface UserLocation {
  ip: string;
  location: string;
}

export const getUserLocation = async (apiUrl: string, headers: BasicHeadersPayload): Promise<UserLocation> => {
  const client = HttpClient.create(apiUrl);
  return client.get<UserLocation>(`${apiUrl}`, basicHeaders(headers));
};
