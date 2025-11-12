import { FastifyReply } from 'fastify';
import { HealthCheckResponse } from '../types';

/**
 * Handles errors from health check requests and returns appropriate responses
 *
 * Response logic:
 * - HTTP < 500 (2xx, 3xx, 4xx): Healthy - Service is functioning
 * - HTTP >= 500 (5xx): Unhealthy - Service has internal errors
 * - No HTTP response: Unhealthy - Service is down (connection error)
 *
 * @param error The error thrown by the health check request
 * @param reply Fastify reply object
 * @param endpoint The endpoint being checked (for logging/response)
 * @param startTime The start time of the request (for response time calculation)
 */
export function handleHealthCheckError(error: unknown, reply: FastifyReply, endpoint: string, startTime: number): void {
  const responseTime = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

  // Try to extract HTTP status code
  let httpStatus: number | undefined;

  if (error && typeof error === 'object') {
    // Check for SDK AppError (has status property directly)
    if ('status' in error && typeof (error as { status?: unknown }).status === 'number') {
      httpStatus = (error as { status: number }).status;
    }

    // Check for axios-style error with response object
    if (httpStatus === undefined && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      httpStatus = axiosError.response?.status;
    }

    // Check for nested error with status in cause
    if (httpStatus === undefined && 'cause' in error) {
      const causeError = error as { cause?: { status?: number; response?: { status?: number } } };
      if (causeError.cause) {
        httpStatus = causeError.cause.status || causeError.cause.response?.status;
      }
    }
  }

  if (httpStatus !== undefined) {
    if (httpStatus < 500) {
      const response: HealthCheckResponse = {
        status: 'healthy',
        endpoint,
        timestamp: new Date().toISOString(),
        responseTime,
      };

      reply.status(200).send(response);
      return;
    }

    reply.log.error(
      {
        error: errorMessage,
        httpStatus,
        endpoint,
      },
      'Health check failed - server error',
    );

    const response: HealthCheckResponse = {
      status: 'unhealthy',
      endpoint,
      timestamp: new Date().toISOString(),
      responseTime,
      error: `Server error: ${httpStatus} - ${errorMessage}`,
    };

    reply.status(503).send(response);
    return;
  }

  reply.log.error(
    {
      error: errorMessage,
      endpoint,
    },
    'Health check failed - no response from server',
  );

  const response: HealthCheckResponse = {
    status: 'unhealthy',
    endpoint,
    timestamp: new Date().toISOString(),
    responseTime,
    error: `Connection error: ${errorMessage}`,
  };

  reply.status(503).send(response);
}
