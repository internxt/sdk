import { AxiosError, AxiosResponse } from "axios";

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
