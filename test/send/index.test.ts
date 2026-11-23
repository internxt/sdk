import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Send } from '../../src/send';
import { GetNetworkTokenResponse } from '../../src/send/types';
import { HttpClient } from '../../src/shared/http/client';
import { basicHeaders } from '../../src/shared/headers';

describe('Send service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Get network token', () => {
    it('When a network token is requested, then it returns the temporary network credentials', async () => {
      const response: GetNetworkTokenResponse = {
        user: 'network-token',
        token: 'network-jwt',
        bucketId: 'send-bucket-id',
        expiresIn: 7200,
      };
      const postSpy = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(response);
      const customHeaders = { 'x-internxt-captcha': 'captcha-token' };
      const client = Send.client('', { clientName: 'c-name', clientVersion: '0.1', customHeaders });

      const result = await client.getNetworkToken();

      expect(result).toStrictEqual(response);
      expect(postSpy).toHaveBeenCalledWith(
        '/links/network-token',
        {},
        basicHeaders({ clientName: 'c-name', clientVersion: '0.1', customHeaders }),
      );
    });
  });
});
