import createClient from 'openapi-fetch';
import type { paths } from '../../../types/drive-server';
import config from '../../config';

const driveApiClient = createClient<paths>({
  baseUrl: config.drive.apiBaseUrl,
});

export default driveApiClient;
