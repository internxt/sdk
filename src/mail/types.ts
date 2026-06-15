import { components, operations } from './schema';

export type MailboxResponse = components['schemas']['MailboxResponseDto'];
export type EmailSummaryResponse = components['schemas']['EmailSummaryResponseDto'];
export type EmailListResponse = components['schemas']['EmailListResponseDto'];
export type EmailResponse = components['schemas']['EmailResponseDto'];
export type EmailCreatedResponse = components['schemas']['EmailCreatedResponseDto'];
export type SendEmailRequest = components['schemas']['SendEmailRequestDto'];
export type EncryptionBlock = components['schemas']['EncryptionBlockDto'];
export type EncryptedWrappedKey = components['schemas']['EncryptedWrappedKeyDto'];
export type LookupRecipientKeysRequest = components['schemas']['LookupRecipientKeysRequestDto'];
export type LookupRecipientKeysResponse = components['schemas']['LookupRecipientKeysResponseDto'];
export type RecipientKey = components['schemas']['RecipientKeyDto'];
export type DraftEmailRequest = components['schemas']['DraftEmailRequestDto'];
export type UpdateEmailRequest = components['schemas']['UpdateEmailRequestDto'];
export type EmailAddress = components['schemas']['EmailAddressDto'];
export type ListEmailsQuery = operations['EmailController_list']['parameters']['query'];
export type ThreadsQuery = operations['EmailController_getThread']['parameters']['query'];
export type SearchFiltersQuery = operations['EmailController_search']['requestBody']['content']['application/json'];
export type EmailDomainsResponse = components['schemas']['MailDomainDto'][];
export type UploadAttachmentResponse = components['schemas']['UploadAttachmentResponseDto'];
export type DownloadAttachmentPayload = operations['EmailController_downloadAttachment']['parameters']['query'];
export type AttachmentRef = components['schemas']['EmailAttachmentDto'];
export type DownloadAttachmentResponse = {
  data: ArrayBuffer;
  contentType: string;
  contentLength?: number;
  fileName?: string;
};
export type SetupMailAccountPayload = {
  address: string;
  domain: string;
  displayName: string;
  password: string;
  keys: {
    publicKey: string;
    encryptionPrivateKey: string;
    recoveryPrivateKey: string;
  };
};

export type MailAccountKeysResponse = {
  address: string;
  publicKey: string;
  encryptionPrivateKey: string;
  recoveryPrivateKey: string;
};

export type MailAccountResponse = {
  id: string;
  defaultAddress: string;
  status: 'active' | 'suspended';
  suspendedAt?: string;
  deletionAt?: string;
};

export type EncryptedKeystore = {
  userEmail: string;
  type: KeystoreType;
  publicKey: string;
  privateKeyEncrypted: string;
};

export enum KeystoreType {
  ENCRYPTION = 'Encryption',
  RECOVERY = 'Recovery',
}

export type HybridEncryptedEmail = {
  encryptedKey: HybridEncKey;
  encEmailBody: EmailBodyEncrypted;
};

type HybridEncKey = {
  hybridCiphertext: string;
  encryptedKey: string;
  encryptedForEmail: string;
};

type EmailBodyEncrypted = {
  encText: string;
  encSubject: string;
  encAttachments?: string[];
};

export type PwdProtectedEmail = {
  encryptedKey: PwdProtectedKey;
  encEmailBody: EmailBodyEncrypted;
};

type PwdProtectedKey = {
  encryptedKey: string;
  salt: string;
};

export type RecipientWithPublicKey = {
  email: string;
  publicKey: string;
};

export type EmailPublicParameters = {
  createdAt: string;
  sender: User;
  recipients: User[];
  ccs?: User[];
  bccs?: User[];
  replyToEmailID?: string;
  labels?: string[];
};

type User = {
  email: string;
  name: string;
};
