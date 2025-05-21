export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly payload?: any;

  /**
   * @param statusCode
   * @param message
   * @param errorCode
   * @param payload
   */
  constructor(statusCode: number, message: string, errorCode?: string, payload?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.payload = payload;

    Object.setPrototypeOf(this, HttpError.prototype);

    this.name = this.constructor.name;
  }
}
