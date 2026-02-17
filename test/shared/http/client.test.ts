import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { HttpClient } from '../../../src/shared/http/client';
import { UnauthorizedCallback } from '../../../src/shared/http/types';
import { fail } from 'assert';

describe('HttpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('construction', () => {
    it('should set the a given base URL', () => {
      // Arrange
      const createSpy = vi.spyOn(axios, 'create');

      // Act
      HttpClient.create('my-url');

      // Assert
      expect(createSpy).toHaveBeenCalledWith({
        baseURL: 'my-url',
      });
    });
  });

  describe('requests', () => {
    describe('interceptors without callback', () => {
      const myAxios = axios.create();

      beforeEach(() => {
        vi.spyOn(axios, 'create').mockReturnValue(myAxios);
      });

      it('should return only the data inside the response', () => {
        // Arrange
        HttpClient.create('');
        const responseFake = {
          data: {
            content: 'something-here',
          },
        };

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const fulfilled = myAxios.interceptors.response.handlers[0].fulfilled;

        // Act
        const result = fulfilled(responseFake as AxiosResponse<any, any, {}>);

        // Assert
        expect(result).toEqual({
          content: 'something-here',
        });
      });

      it('should return the received error message on valid response', () => {
        const error = getAxiosError();
        error.response = <AxiosResponse>{
          data: {
            error: 'here-my-message',
          },
        };
        assertMessageOnOutputError(myAxios, error, 'here-my-message');
      });

      it('should return the received data when no error message on valid response', () => {
        const error = getAxiosError();
        error.response = <AxiosResponse>{
          data: 'at-least-this',
        };
        assertMessageOnOutputError(myAxios, error, 'at-least-this');
      });

      it('should return generic message when request failed', () => {
        const error = getAxiosError();
        error.response = undefined;
        error.request = true;
        assertMessageOnOutputError(myAxios, error, 'Server unavailable');
      });

      it('should return reason error message when setting request failed', () => {
        const error = getAxiosError();
        error.message = 'wat-did-u-do?';
        assertMessageOnOutputError(myAxios, error, 'wat-did-u-do?');
      });

      it('should return unauthorized message if unauthorized callback is not present', () => {
        const error = getAxiosError();
        error.response = <AxiosResponse>{
          data: {
            error: 'not authorized',
          },
          status: 401,
        };
        assertMessageOnOutputError(myAxios, error, 'not authorized');
      });
    });

    describe('interceptor with callback', () => {
      it('should return unauthorized and execute callback if unauthorized callback is present', () => {
        const myAxios = axios.create();
        vi.spyOn(axios, 'create').mockReturnValue(myAxios);

        const error = getAxiosError();
        error.response = <AxiosResponse>{
          data: {
            error: 'not authorized',
          },
          status: 401,
        };
        const unauthorizedSpy = vi.fn();

        assertMessageOnOutputError(myAxios, error, 'not authorized', unauthorizedSpy);
        expect(unauthorizedSpy).toHaveBeenCalledOnce();
      });
    });

    describe('calls', () => {
      it('should execute GET request with correct parameters', async () => {
        // Arrange
        const callStub = vi.spyOn(axios.Axios.prototype, 'get').mockResolvedValue({});
        const client = HttpClient.create('');

        // Act
        await client.get('/some-path?with=arguments', {
          some: 'header',
        });

        // Assert
        expect(callStub).toHaveBeenCalledWith('/some-path?with=arguments', {
          headers: {
            some: 'header',
          },
        });
      });

      it('should be able to cancel a GET request', async () => {
        // Arrange
        const client = HttpClient.create('');

        // Act
        const { promise, requestCanceler } = client.getCancellable('/some-path', {});
        requestCanceler.cancel('my-cancel-message');

        // Assert
        await expect(promise).rejects.toThrow('my-cancel-message');
      });

      it('should be able to complete a cancellable GET request', async () => {
        // Arrange
        vi.spyOn(axios.Axios.prototype, 'get').mockResolvedValue({
          some: true,
        });
        const client = HttpClient.create('');

        // Act
        const { promise } = client.getCancellable('/some-path', {});

        // Assert
        await expect(promise).resolves.toEqual({
          some: true,
        });
      });

      it('should execute POST request with correct parameters', async () => {
        // Arrange
        const callStub = vi.spyOn(axios.Axios.prototype, 'post').mockResolvedValue({});
        const client = HttpClient.create('');

        // Act
        await client.post(
          '/some-path',
          {
            something: 'here',
            else: 'there',
          },
          {
            some: 'header',
          },
        );

        // Assert
        expect(callStub).toHaveBeenCalledWith(
          '/some-path',
          {
            something: 'here',
            else: 'there',
          },
          {
            headers: {
              some: 'header',
            },
          },
        );
      });

      it('should be able to cancel a POST request', async () => {
        // Arrange
        const client = HttpClient.create('');

        // Act
        const { promise, requestCanceler } = client.postCancellable('/some-path', {}, {});
        requestCanceler.cancel('my-cancel-message');

        // Assert
        await expect(promise).rejects.toThrow('my-cancel-message');
      });

      it('should be able to complete a cancellable a POST request', async () => {
        // Arrange
        vi.spyOn(axios.Axios.prototype, 'post').mockResolvedValue({
          some: true,
        });
        const client = HttpClient.create('');

        // Act
        const { promise } = client.postCancellable('/some-path', {}, {});

        // Assert
        await expect(promise).resolves.toEqual({
          some: true,
        });
      });

      it('should execute PUT request with correct parameters', async () => {
        // Arrange
        const callStub = vi.spyOn(axios.Axios.prototype, 'put').mockResolvedValue({});
        const client = HttpClient.create('');

        // Act
        await client.put(
          '/some-path',
          {
            something: 'here',
            else: 'there',
          },
          {
            some: 'header',
          },
        );

        // Assert
        expect(callStub).toHaveBeenCalledWith(
          '/some-path',
          {
            something: 'here',
            else: 'there',
          },
          {
            headers: {
              some: 'header',
            },
          },
        );
      });

      it('should execute PATCH request with correct parameters', async () => {
        // Arrange
        const callStub = vi.spyOn(axios.Axios.prototype, 'patch').mockResolvedValue({});
        const client = HttpClient.create('');

        // Act
        await client.patch(
          '/some-path',
          {
            something: 'here',
            else: 'there',
          },
          {
            some: 'header',
          },
        );

        // Assert
        expect(callStub).toHaveBeenCalledWith(
          '/some-path',
          {
            something: 'here',
            else: 'there',
          },
          {
            headers: {
              some: 'header',
            },
          },
        );
      });

      it('should execute DELETE request with correct parameters', async () => {
        // Arrange
        const callStub = vi.spyOn(axios.Axios.prototype, 'delete').mockResolvedValue({});
        const client = HttpClient.create('');

        // Act
        await client.delete(
          '/some-path',
          {
            some: 'header',
          },
          {
            something: 'here',
            else: 'there',
          },
        );

        // Assert
        expect(callStub).toHaveBeenCalledWith('/some-path', {
          data: {
            something: 'here',
            else: 'there',
          },
          headers: {
            some: 'header',
          },
        });
      });
    });
  });
});

function getAxiosError(): AxiosError {
  return {
    config: <InternalAxiosRequestConfig>{},
    isAxiosError: false,
    message: '',
    name: '',
    response: undefined,
    request: undefined,
    stack: '',
    toJSON(): object {
      return {};
    },
  };
}

function assertMessageOnOutputError(
  axios: AxiosInstance,
  error: AxiosError,
  message: string,
  unauthorizedCallback?: UnauthorizedCallback,
) {
  // Arrange
  HttpClient.create('', unauthorizedCallback);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rejected = axios.interceptors.response.handlers[0].rejected;

  // Act & Assert
  expect(() => {
    rejected?.(error);
    fail('Expected function to throw an error, but it did not.');
  }).toThrow(message);
}
