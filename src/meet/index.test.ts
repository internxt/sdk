import sinon from 'sinon';
import { ApiSecurity, AppDetails } from '../shared';
import { basicHeaders, headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import { Meet } from './index';
import { CreateCallResponse, JoinCallPayload, JoinCallResponse, UsersInCallResponse } from './types';

const httpClient = HttpClient.create('');

describe('Meet service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createCall method', () => {
    it('should successfully create a call with token', async () => {
      // Arrange
      const expectedResponse: CreateCallResponse = {
        token: 'call-token',
        room: 'room-id',
        paxPerCall: 10,
        appId: 'app-id',
      };

      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'post').resolves(expectedResponse);

      // Act
      const response = await client.createCall();

      // Assert
      expect(postCall.firstCall.args).toEqual(['call', {}, headers]);
      expect(response).toEqual(expectedResponse);
    });

    it('should throw an error when token is missing', async () => {
      // Arrange
      const { client } = clientAndHeadersWithoutToken();

      // Act & Assert
      await expect(client.createCall()).rejects.toThrow('Token is required for Meet operations');
    });
  });

  describe('joinCall method', () => {
    const callId = 'call-123';
    const payload: JoinCallPayload = {
      name: 'John',
      lastname: 'Doe',
      anonymous: false,
    };

    const joinCallResponse: JoinCallResponse = {
      token: 'join-token',
      room: 'room-id',
      userId: 'user-123',
      appId: 'app-id',
    };

    it('should join a call successfully with token', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'post').resolves(joinCallResponse);

      // Act
      const response = await client.joinCall(callId, payload);

      // Assert
      expect(postCall.firstCall.args).toEqual([`call/${callId}/users/join`, payload, headers]);
      expect(response).toEqual(joinCallResponse);
    });

    it('should join a call successfully without token', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithoutToken();
      const postCall = sinon.stub(httpClient, 'post').resolves(joinCallResponse);

      // Act
      const response = await client.joinCall(callId, payload);

      // Assert
      expect(postCall.firstCall.args[0]).toEqual(`call/${callId}/users/join`);
      expect(postCall.firstCall.args[1]).toEqual(payload);
      expect(postCall.firstCall.args[2]).toEqual(headers);
      expect(response).toEqual(joinCallResponse);
    });
  });

  describe('getCurrentUsersInCall method', () => {
    const callId = 'call-123';
    const usersInCallResponse: UsersInCallResponse[] = [
      {
        userId: 'user-123',
        name: 'John',
        lastname: 'Doe',
        anonymous: false,
        avatar: 'avatar-url-1',
      },
      {
        userId: 'user-456',
        name: 'Jane',
        lastname: 'Smith',
        anonymous: true,
        avatar: 'avatar-url-2',
      },
    ];

    it('should get current users in call successfully with token', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const getCall = sinon.stub(httpClient, 'get').resolves(usersInCallResponse);

      // Act
      const response = await client.getCurrentUsersInCall(callId);

      // Assert
      expect(getCall.firstCall.args).toEqual([`call/${callId}/users`, headers]);
      expect(response).toEqual(usersInCallResponse);
    });

    it('should get current users in call successfully without token', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithoutToken();
      const getCall = sinon.stub(httpClient, 'get').resolves(usersInCallResponse);

      // Act
      const response = await client.getCurrentUsersInCall(callId);

      // Assert
      expect(getCall.firstCall.args[0]).toEqual(`call/${callId}/users`);
      expect(getCall.firstCall.args[1]).toEqual(headers);
      expect(response).toEqual(usersInCallResponse);
    });
  });

  describe('leaveCall method', () => {
    const callId = 'call-123';

    it('should leave a call successfully with token', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithToken();
      const postCall = sinon.stub(httpClient, 'post').resolves();

      // Act
      await client.leaveCall(callId);

      // Assert
      expect(postCall.firstCall.args).toEqual([`call/${callId}/users/leave`, {}, headers]);
    });

    it('should leave a call successfully without token', async () => {
      // Arrange
      const { client, headers } = clientAndHeadersWithoutToken();
      const postCall = sinon.stub(httpClient, 'post').resolves();

      // Act
      await client.leaveCall(callId);

      // Assert
      expect(postCall.firstCall.args[0]).toEqual(`call/${callId}/users/leave`);
      expect(postCall.firstCall.args[1]).toEqual({});
      expect(postCall.firstCall.args[2]).toEqual(headers);
    });
  });
});

function clientAndHeadersWithToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
): {
  client: Meet;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName,
    clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token,
  };
  const client = Meet.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}

function clientAndHeadersWithoutToken(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
): {
  client: Meet;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName,
    clientVersion,
  };
  const client = Meet.client(apiUrl, appDetails);
  const headers = basicHeaders({ clientName, clientVersion });
  return { client, headers };
}
