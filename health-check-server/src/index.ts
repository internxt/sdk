import app from './app';
import logger from './utils/logger';
import { HttpError } from './errors/base-http-error';
import driveRoutes from './routes/drive';
import { Request, Response, NextFunction } from 'express';

const PORT = process.env.PORT || 3001;

app.use('/drive', driveRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      errorCode: err.errorCode,
      payload: err.payload,
    });
  } else {
    logger.error('[Unhandled Error]', err);
    res.status(500).json({
      status: 'ERROR',
      message: 'An unexpected internal server error occurred.',
    });
  }
});

app.listen(PORT, () => {
  logger.info(`✅ Health check server running on port ${PORT}`);
});
