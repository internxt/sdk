export interface CreateSendLinkPayload {
    sender: string;
    receivers: string[];
    code: string;
    title: string;
    subject: string;
    items: Array<{
        name: string;
        type: string;
        networkId: string;
        encryptionKey: string;
        size: number;
    }>
}

export interface SendLink {
    id: string;
    title: string;
    subject: string;
    code: string;
    sender: string;
    receivers: string[];
    views: number;
    userId: string | null;
    items: Array<{
        id: string;
        name: string;
        type: string;
        linkId: string;
        networkId: string;
        encryptionKey: string;
        size: number;
        createdAt: string;
        updatedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
    expirationAt: string;
}