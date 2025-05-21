import { LoginDetails } from '../../../../src/auth/types.js';
import { passToHash, decryptText, encryptText } from '../../utils/crypto';
import { ServiceUnhealthyError } from '../../errors/service-unhealthy';
import driveApiClient from './client';

export async function performDriveLogin(userEmail: string, userPassword: string) {
  const accessData = await getAccessData(userEmail);

  const encryptedSalt = accessData.data.sKey;
  const loginRequestDetails: LoginDetails = {
    email: userEmail,
    password: createPassHashAndEncrypt(userPassword, encryptedSalt),
    tfaCode: '',
  };
  const response = await requestLogin(loginRequestDetails);

  return response;
}

async function getAccessData(email: string) {
  const loginEmail = { email };
  const { data, error } = await driveApiClient.POST('/api/auth/login', { body: loginEmail });
  if (error) {
    throw new ServiceUnhealthyError('/api/auth/login', error, (error as any).status);
  }

  return {
    data,
  };
}

async function requestLogin(loginDetails: LoginDetails) {
  const { data, error } = await driveApiClient.POST('/api/auth/login/access', { body: loginDetails });
  if (error) {
    throw new ServiceUnhealthyError('/api/auth/login/access', error, (error as any).status);
  }

  return {
    data,
    error,
  };
}

function createPassHashAndEncrypt(password: string, encryptedSalt: string): string {
  if (!encryptedSalt) {
    throw new Error('Encrypted salt is required for password hashing.');
  }
  const salt = decryptText(encryptedSalt);
  const hashObj = passToHash({ password, salt });
  return encryptText(hashObj.hash);
}
