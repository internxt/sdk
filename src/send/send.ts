import { ApiUrl, AppDetails } from '../shared';
import { basicHeaders } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import { CreateSendLinksPayload, CreateSendLinksResponse, GetSendLinkResponse } from './types';

export class Send {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails) {
    return new Send(apiUrl, appDetails);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails) {
    this.client = HttpClient.create(apiUrl);
    this.appDetails = appDetails;
  }

  /**
   * Gets a send link by its id
   * @param linkId id of the send link
   * @returns a promise with the send link data
   */
  public getSendLink(linkId: string): Promise<GetSendLinkResponse> {
    return this.client.get('/links/' + linkId, this.headers());
  }

  /**
   * Creates a new send link
   * @param payload contains the data to create a new send link
   * @returns a promise with the newly created send link data
   */
  public createSendLink(payload: CreateSendLinksPayload): Promise<CreateSendLinksResponse> {
    // Spread payload into a plain object literal so it matches the `Parameters`/Record<string, unknown> expected by HttpClient.post
    return this.client.post('/links/', { ...payload }, this.headers());
  }

  /**
   * Returns the basic needed headers for the module requests
   * @private
   */
  private headers() {
    return basicHeaders({
      clientName: this.appDetails.clientName,
      clientVersion: this.appDetails.clientVersion,
      customHeaders: this.appDetails.customHeaders,
    });
  }
}
