import express from 'express';
import { performDriveLogin } from '../services/drive/auth.service';
import logger from '../utils/logger';
import config from '../config';

const router = express.Router();

router.get('/login', async (req, res, next) => {
  try {
    const account = config.drive.driveUserAccount;
    const password = config.drive.driveUserPassword;

    if (!account || !password) {
      logger.error('Drive user account or password is not configured.');
      res.status(500).json({ status: 'ERROR', message: 'Drive user account or password is not configured.' });
      return;
    }

    await performDriveLogin(account, password);

    res.status(200).json({ status: 'OK', message: 'Health check for /drive/login successful.' });
  } catch (error) {
    logger.error('Health check for /drive/login failed:', error);
    next(error);
  }
});

export default router;
