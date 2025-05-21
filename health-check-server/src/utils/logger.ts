import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.simple()),
  defaultMeta: { service: 'health-check-server' },
  transports: [new transports.Console()],
});

export default logger;
