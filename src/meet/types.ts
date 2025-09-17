export interface CreateCallResponse {
  token: string;
  room: string;
  paxPerCall: number;
  appId: string;
}

export interface JoinCallPayload {
  name: string;
  lastname: string;
  anonymous?: boolean;
  anonymousId?: string;
}

export interface JoinCallResponse {
  token: string;
  room: string;
  userId: string;
  appId: string;
}

export interface UsersInCallResponse {
  userId: string;
  name: string;
  lastname: string;
  anonymous: boolean;
  avatar: string;
}
