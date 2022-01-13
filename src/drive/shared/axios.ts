import axios from 'axios';
import { ApiUrl } from '../../shared';

export function getDriveAxiosClient(apiUrl: ApiUrl) {
  return axios.create({
    baseURL: apiUrl + '/api',
  });
}