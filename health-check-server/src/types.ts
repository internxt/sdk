export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  endpoint: string;
  timestamp: string;
  responseTime?: number;
  error?: string;
}

export interface Config {
  port: number;
  apiUrl: string;
  authToken: string;
  clientName: string;
  clientVersion: string;
  nodeEnv: string;
  loginEmail: string;
  loginPassword: string;
  cryptoSecret: string;
  magicIv: string;
  magicSalt: string;
}
