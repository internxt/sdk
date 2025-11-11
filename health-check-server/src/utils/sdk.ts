import crypto from 'crypto';
import { Network } from '../../../src/network';
import { Storage } from '../../../src/drive/storage';
import { Users } from '../../../src/drive/users';
import { config } from '../config';

interface NetworkClientOptions {
  bridgeUser: string;
  userId: string;
}

interface StorageClientOptions {
  token: string;
}

interface UsersClientOptions {
  token: string;
}

/**
 * Creates SHA-256 hash of input string
 */
function getSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Creates a Network client for uploading files to the network layer
 * Requires bridgeUser and userId from user settings
 */
export function getNetworkClient(options: NetworkClientOptions): Network {
  const hashedUserId = getSha256(options.userId);

  return Network.client(
    config.networkUrl,
    {
      clientName: config.clientName,
      clientVersion: config.clientVersion,
    },
    {
      bridgeUser: options.bridgeUser,
      userId: hashedUserId,
    },
  );
}

export function getStorageClient(options: StorageClientOptions): Storage {
  return Storage.client(
    config.apiUrl,
    {
      clientName: config.clientName,
      clientVersion: config.clientVersion,
    },
    {
      token: options.token,
      unauthorizedCallback: () => {
        throw new Error('Unauthorized callback triggered during health check');
      },
    },
  );
}

/**
 * Creates a Users client for user operations
 * Requires JWT token for authentication
 */
export function getUsersClient(options: UsersClientOptions): Users {
  return Users.client(
    config.apiUrl,
    {
      clientName: config.clientName,
      clientVersion: config.clientVersion,
    },
    {
      token: options.token,
      unauthorizedCallback: () => {
        throw new Error('Unauthorized callback triggered during health check');
      },
    },
  );
}
