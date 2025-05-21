import { HttpError } from './base-http-error';

export class ServiceUnhealthyError extends HttpError {
  /**
   * @param endpointName
   * @param details
   * @param underlyingStatusCode
   */
  constructor(endpointName: string, details?: any, underlyingStatusCode?: number | null) {
    const message = `The service ${endpointName} is unhealthy.`;
    const statusCodeForHealthCheck = underlyingStatusCode && underlyingStatusCode >= 400 ? underlyingStatusCode : 503;

    super(statusCodeForHealthCheck, message, 'SERVICE_UNHEALTHY', {
      monitoredEndpoint: endpointName,
      reason: details,
      originalApiStatus: underlyingStatusCode,
    });
    this.name = this.constructor.name;
  }
}
