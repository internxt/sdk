import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bip39 from 'bip39';
import { LoginDetails, RegisterDetails } from '../../../src/auth';
import { UserSettings } from '../../../src/shared/types/userSettings';
import { config } from '../config';
import { HealthCheckResponse } from '../types';
import { getAuthClient, cryptoProvider } from '../utils/auth';
import { handleHealthCheckError } from '../utils/healthCheck';
import { passToHash, encryptText, encryptTextWithKey, decryptMnemonic } from '../utils/crypto';
import { getNetworkClient, getStorageClient, getUsersClient } from '../utils/sdk';
import { createCryptoProvider, encryptBuffer, decryptBuffer, toBinaryData } from '../utils/fileCrypto';

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

  fastify.post('/drive/files', async (request: FastifyRequest, reply: FastifyReply) => {
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
      const plaintextBuffer = Buffer.from(fileContent);

      const crypto = createCryptoProvider();

      const decryptedMnemonic = decryptMnemonic(user.mnemonic, config.loginPassword);

      fastify.log.info(`Decrypted mnemonic: ${decryptedMnemonic.substring(0, 20)}...`);

      if (!crypto.validateMnemonic(decryptedMnemonic)) {
        throw new Error('Invalid mnemonic');
      }

      const index = crypto.randomBytes(crypto.algorithm.ivSize);
      const iv = index.slice(0, 16);

      const key = await crypto.generateFileKey(decryptedMnemonic, user.bucket, index);

      const encryptedBuffer = encryptBuffer(plaintextBuffer, key as Buffer, iv as Buffer);
      const encryptedSize = encryptedBuffer.length;

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
              size: encryptedSize,
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
        body: encryptedBuffer,
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
              index: index.toString('hex'),
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
              index: index.toString('hex'),
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
        size: encryptedSize,
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

  fastify.get('/drive/download', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      const usersClient = getUsersClient({ token: config.authToken });
      const refreshResponse = await usersClient.refreshUser();
      const user = refreshResponse.user as unknown as UserSettings;

      if (!user.bucket || !user.userId || !user.bridgeUser || !user.mnemonic || !user.rootFolderId) {
        throw new Error('User missing required fields: bucket, userId, bridgeUser, mnemonic, rootFolderId');
      }

      const driveStorageClient = getStorageClient({ token: config.authToken });

      const [folderContentPromise] = driveStorageClient.getFolderContentByUuid({
        folderUuid: user.rootFolderId,
        trash: false,
        offset: 0,
        limit: 50,
      });

      const folderContent = await folderContentPromise;

      if (!folderContent?.files || folderContent.files.length === 0) {
        throw new Error('No files found in root folder. Upload a file first using POST /drive/upload');
      }

      const healthCheckFiles = folderContent.files.filter((file) => file.plainName?.startsWith('health-check-'));

      if (healthCheckFiles.length === 0) {
        throw new Error('No health-check files found. Upload a file first using POST /drive/upload');
      }

      const mostRecentFile = [...healthCheckFiles].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      fastify.log.info(`Attempting to download file: ${mostRecentFile.plainName} (fileId: ${mostRecentFile.fileId})`);

      const networkClient = getNetworkClient({
        bridgeUser: user.bridgeUser,
        userId: user.userId,
      });

      const downloadInfo = await networkClient.getDownloadLinks(user.bucket, mostRecentFile.fileId);

      if (!downloadInfo.index || !downloadInfo.shards || downloadInfo.shards.length === 0) {
        throw new Error('Download info missing index or shards');
      }

      const downloadUrl = downloadInfo.shards[0].url;

      if (!downloadUrl) {
        throw new Error('No download URL in shard');
      }

      const downloadResponse = await fetch(downloadUrl);

      if (!downloadResponse.ok) {
        throw new Error(`File download failed with status ${downloadResponse.status}`);
      }

      const downloadedEncryptedBuffer = Buffer.from(await downloadResponse.arrayBuffer());

      const crypto = createCryptoProvider();

      const decryptedMnemonic = decryptMnemonic(user.mnemonic, config.loginPassword);

      if (!crypto.validateMnemonic(decryptedMnemonic)) {
        throw new Error('Invalid mnemonic');
      }

      const downloadedIndex = toBinaryData(downloadInfo.index, 'hex');
      const downloadedIv = downloadedIndex.subarray(0, 16);
      const downloadedKey = await crypto.generateFileKey(decryptedMnemonic, user.bucket, downloadedIndex);

      const decryptedBuffer = decryptBuffer(downloadedEncryptedBuffer, downloadedKey as Buffer, downloadedIv as Buffer);

      const decryptedContent = decryptedBuffer.toString('utf-8');

      if (!decryptedContent.includes('Internxt Health Check Upload Test')) {
        throw new Error('Decrypted content does not match expected health check pattern');
      }

      if (!decryptedContent.includes('Timestamp:')) {
        throw new Error('Decrypted content missing timestamp field');
      }

      const responseTime = Date.now() - startTime;

      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint: 'drive/download',
        timestamp: new Date().toISOString(),
        responseTime,
      };

      fastify.log.info(
        `Download health check successful - file "${mostRecentFile.plainName}"
         decrypted and verified (${decryptedContent.length} bytes)`,
      );

      return reply.status(200).send(response);
    } catch (error: unknown) {
      fastify.log.error(error);
      handleHealthCheckError(error, reply, 'drive/download', startTime);
    }
  });

  fastify.log.info('Drive routes registered');
}
