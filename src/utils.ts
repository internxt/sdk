import { AxiosError, AxiosResponse } from 'axios';

export function extractAxiosErrorMessage(err: AxiosError): string {
  let errMsg: string;
  const error: AxiosError = err as AxiosError;

  const isServerError = !!error.response;
  const serverUnavailable = !!error.request;

  if (isServerError) {
    errMsg = (error.response as AxiosResponse<{ error: string }>).data.error;
  } else if (serverUnavailable) {
    errMsg = 'Server not available';
  } else {
    errMsg = error.message;
  }

  return errMsg;
}

export function isHexString(string: string) {
  if (typeof string !== 'string') {
    return false;
  }

  return /^([0-9a-fA-F]{2})+$/.test(string);
}
