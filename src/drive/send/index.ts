import { ApiUrl, AppDetails } from '../../shared';
import { HttpClient } from '../../shared/http/client';
import { SendLink, CreateSendLinkPayload } from './types';
import { basicHeaders } from '../../shared/headers';
export class Send {
    private readonly client: HttpClient;
    private readonly appDetails: AppDetails;

    public static client(apiUrl: ApiUrl, appDetails: AppDetails) {
        return new Send(apiUrl, appDetails);
      }
    constructor(apiUrl: ApiUrl, appDetails: AppDetails) {
        this.client = HttpClient.create(apiUrl);
        this.appDetails = appDetails;
    }

    public createSendLink(payload: CreateSendLinkPayload): Promise<SendLink> {
        const { items, sender, receivers, code, title, subject } = payload;
        return this.client
            .post(
                '/links',
                {
                    items,
                    sender,
                    receivers,
                    code,
                    title,
                    subject 
                },
                this.headers()
            );
    }

    public getSendLink(sendLinkId: string): Promise<SendLink> {
        return this.client
            .get(
                `/links/${sendLinkId}`,
                this.headers()
            );
    }

    private headers() {
        return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
    }
}