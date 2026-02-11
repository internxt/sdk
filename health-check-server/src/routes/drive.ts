import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bip39 from 'bip39';
import { LoginDetails, RegisterDetails } from '../../../src/auth';
import { UserSettings } from '../../../src/shared/types/userSettings';
import { config } from '../config';
import { HealthCheckResponse } from '../types';
import { getAuthClient, cryptoProvider } from '../utils/auth';
import { handleHealthCheckError } from '../utils/healthCheck';
import { passToHash, encryptText, encryptTextWithKey } from '../utils/crypto';

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

  fastify.log.info('Drive routes registered');
}
