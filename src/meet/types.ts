export interface CreateCallResponse {
  token: string;
  room: string;
  paxPerCall: number;
}

export interface JoinCallPayload {
  name: string;
  lastname: string;
  anonymous: boolean;
}

export interface JoinCallResponse {
  token: string;
  room: string;
  userId: string;
}

export interface UsersInCallResponse {
  userId: string;
  name: string;
  lastname: string;
  anonymous: boolean;
  avatar: string;
}
