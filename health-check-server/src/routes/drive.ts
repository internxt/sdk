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
      const loginDetails: LoginDetails = {
        email: config.loginEmail,
        password: config.loginPassword,
        tfaCode: undefined,
      };

      await authClient.loginWithoutKeys(loginDetails, cryptoProvider);

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

  fastify.log.info('Drive routes registered');
}
