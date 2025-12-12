import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LoginDetails } from '../../../src/auth';
import { config } from '../config';
import { HealthCheckResponse } from '../types';
import { getAuthClient, cryptoProvider } from '../utils/auth';
import { handleHealthCheckError } from '../utils/healthCheck';

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

  fastify.log.info('Drive routes registered');
}
