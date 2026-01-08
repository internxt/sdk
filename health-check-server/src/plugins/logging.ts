import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Logging plugin for Fastify
 * Logs all incoming requests and their responses
 */
export async function loggingPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
      },
      'Incoming request',
    );
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'Request completed',
    );
  });

  fastify.log.info('Logging plugin registered');
}
