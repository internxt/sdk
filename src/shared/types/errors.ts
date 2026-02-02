export default class AppError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly headers?: Record<string, string>;

  constructor(message: string, status?: number, code?: string, headers?: Record<string, string>) {
    super(message);

    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}
