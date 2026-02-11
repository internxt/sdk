import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Error handler plugin for Fastify
 * Transforms errors into standardized health check responses
 */
export async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error(
      {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      },
      'Error occurred during request',
    );

    const statusCode = error.statusCode ?? 503;

    return reply.status(statusCode).send({
      status: 'unhealthy',
      endpoint: request.url,
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  });

  fastify.log.info('Error handler plugin registered');
}
