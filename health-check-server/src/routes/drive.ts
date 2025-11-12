import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bip39 from 'bip39';
import { LoginDetails, RegisterDetails } from '../../../src/auth';
import { UserSettings } from '../../../src/shared/types/userSettings';
import { config } from '../config';
import { HealthCheckResponse } from '../types';
import { getAuthClient, cryptoProvider } from '../utils/auth';
import { handleHealthCheckError } from '../utils/healthCheck';
import { passToHash, encryptText, encryptTextWithKey } from '../utils/crypto';
import { getNetworkClient, getStorageClient, getUsersClient } from '../utils/sdk';

export async function driveRoutes(fastify: FastifyInstance) {
  const authClient = getAuthClient();

  fastify.post('/drive/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const securityDetails = await authClient.securityDetails(config.loginEmail);

      if (!securityDetails.encryptedSalt) {
        throw new Error('Security details did not return encryptedSalt');
      }

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint: 'drive/login',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      return reply.status(200).send(response);
    } catch (error: unknown) {
      handleHealthCheckError(error, reply, 'drive/login', startTime);
    }
  });

  fastify.post('/drive/access', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const loginDetails: LoginDetails = {
        email: config.loginEmail,
        password: config.loginPassword,
        tfaCode: undefined,
      };

      const loginResponse = await authClient.loginWithoutKeys(loginDetails, cryptoProvider);

      // Verify we got both JWT tokens
      if (!loginResponse.token || !loginResponse.newToken) {
        throw new Error('Login response did not return both JWT tokens');
      }

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint: 'drive/access',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      return reply.status(200).send(response);
    } catch (error: unknown) {
      handleHealthCheckError(error, reply, 'drive/access', startTime);
    }
  });

  fastify.post('/drive/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const timestamp = Date.now();
      const email = `dev+${timestamp}@internxt.com`;
      const password = config.loginPassword;

      // Generate password hash and salt
      const hashObj = passToHash({ password });
      const encPass = encryptText(hashObj.hash);
      const encSalt = encryptText(hashObj.salt);

      const mnemonic = bip39.generateMnemonic(256);
      const encMnemonic = encryptTextWithKey(mnemonic, password);

      const keys = await cryptoProvider.generateKeys(password);

      const registerDetails: RegisterDetails = {
        name: 'Health',
        lastname: 'Check',
        email: email.toLowerCase(),
        password: encPass,
        salt: encSalt,
        mnemonic: encMnemonic,
        keys: keys,
        captcha: '',
        referral: undefined,
        referrer: undefined,
      };

      const data = await authClient.register(registerDetails);

      const user = data.user as unknown as UserSettings;

      const hasRequiredFields =
        user.email &&
        user.rootFolderId &&
        user.bucket &&
        user.keys?.ecc?.publicKey &&
        user.keys?.ecc?.privateKey &&
        user.keys?.kyber?.publicKey &&
        user.keys?.kyber?.privateKey;

      if (!hasRequiredFields) {
        throw new Error('Response missing required fields: kyber/ecc keys, email, rootFolderId, or bucket');
      }

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint: 'drive/signup',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      fastify.log.info(`Signup health check successful - created account: ${email}`);

      return reply.status(200).send(response);
    } catch (error: unknown) {
      handleHealthCheckError(error, reply, 'drive/signup', startTime);
    }
  });

  fastify.post('/drive/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const usersClient = getUsersClient({ token: config.authToken });
      const refreshResponse = await usersClient.refreshUser();
      const user = refreshResponse.user as unknown as UserSettings;

      if (!user.bucket || !user.userId || !user.bridgeUser || !user.mnemonic || !user.rootFolderId) {
        throw new Error('User missing required fields for upload: bucket, userId, bridgeUser, mnemonic, rootFolderId');
      }

      const timestamp = Date.now();
      const fileName = `health-check-${timestamp}`;

      const fileContent = `Internxt Health Check Upload Test\nTimestamp: ${new Date(
        timestamp,
      ).toISOString()}\n${'='.repeat(950)}`;
      const fileBuffer = Buffer.from(fileContent);
      const fileSize = fileBuffer.length;

      const networkClient = getNetworkClient({
        bridgeUser: user.bridgeUser,
        userId: user.userId,
      });

      const parts = 1;
      const { uploads } = await networkClient.startUpload(
        user.bucket,
        {
          uploads: [
            {
              index: 0,
              size: fileSize,
            },
          ],
        },
        parts,
      );

      const [{ url, urls, uuid, UploadId }] = uploads;

      if (!url && (!urls || urls.length === 0)) {
        throw new Error('No upload URL received from network');
      }

      const uploadUrl = url || urls![0];

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileBuffer,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`File upload to network failed with status ${uploadResponse.status}`);
      }

      // Get ETag from response for multipart finish
      const etag = uploadResponse.headers.get('etag')?.replaceAll('"', '') || '';

      const finishPayload =
        parts > 1 && UploadId
          ? {
              index: '0'.repeat(64), // Mock index for health check
              shards: [
                {
                  hash: etag,
                  uuid,
                  UploadId,
                  parts: [{ PartNumber: 1, ETag: etag }],
                },
              ],
            }
          : {
              index: '0'.repeat(64), // Mock index for health check
              shards: [{ hash: etag, uuid }],
            };

      const networkFinishResponse = await networkClient.finishUpload(user.bucket, finishPayload);

      if (!networkFinishResponse.id) {
        throw new Error('Network finish upload did not return file ID');
      }

      const networkFileId = networkFinishResponse.id;

      const driveStorageClient = getStorageClient({ token: config.authToken });

      const fileEntry = {
        fileId: networkFileId,
        type: 'txt',
        size: fileSize,
        plainName: fileName,
        bucket: user.bucket,
        folderUuid: user.rootFolderId,
        encryptVersion: 'Aes03' as const,
      };

      const driveFileResponse = await driveStorageClient.createFileEntryByUuid(fileEntry);

      if (!driveFileResponse.uuid || !driveFileResponse.fileId || !driveFileResponse.plainName) {
        throw new Error('Drive file entry creation missing required fields: uuid, fileId, or plainName');
      }

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint: 'drive/upload',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      return reply.status(200).send(response);
    } catch (error: unknown) {
      fastify.log.error(error);
      handleHealthCheckError(error, reply, 'drive/upload', startTime);
    }
  });

  fastify.get('/drive/files', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const usersClient = getUsersClient({ token: config.authToken });
      const refreshResponse = await usersClient.refreshUser();
      const user = refreshResponse.user as unknown as UserSettings;

      if (!user.rootFolderId) {
        throw new Error('User missing required field: rootFolderId');
      }

      const driveStorageClient = getStorageClient({ token: config.authToken });

      const [folderContentPromise] = driveStorageClient.getFolderContentByUuid({
        folderUuid: user.rootFolderId,
        trash: false,
        offset: 0,
        limit: 50,
      });

      const folderContent = await folderContentPromise;

      if (!folderContent || (!folderContent.files && !folderContent.children)) {
        throw new Error('Folder content response missing expected structure (files or children array)');
      }

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint: 'folders/content/:uuid/?offset=0&limit=50&trash=false',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      return reply.status(200).send(response);
    } catch (error: unknown) {
      fastify.log.error(error);
      handleHealthCheckError(error, reply, 'drive/retrieval', startTime);
    }
  });

  fastify.log.info('Drive routes registered');
}
