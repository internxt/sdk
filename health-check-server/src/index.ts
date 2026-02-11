import Fastify from 'fastify';
import { config } from './config';
import { loggingPlugin } from './plugins/logging';
import { errorHandlerPlugin } from './plugins/errorHandler';
import { driveRoutes } from './routes/drive';

async function start() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  try {
    await fastify.register(loggingPlugin);
    await fastify.register(errorHandlerPlugin);

    await fastify.register(driveRoutes);

    fastify.get('/health', async () => {
      return {
        status: 'healthy',
        service: 'health-check-server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    fastify.log.info('Health check server started successfully');
    fastify.log.info(`Listening on port ${config.port}`);
    fastify.log.info(`API URL: ${config.apiUrl}`);
    fastify.log.info(`Environment: ${config.nodeEnv}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  process.stdout.write('\nShutting down gracefully...\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.stdout.write('\nShutting down gracefully...\n');
  process.exit(0);
});

start();
