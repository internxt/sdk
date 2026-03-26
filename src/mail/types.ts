import { components, operations } from './schema';

export type MailboxResponse = components['schemas']['MailboxResponseDto'];
export type EmailSummaryResponse = components['schemas']['EmailSummaryResponseDto'];
export type EmailListResponse = components['schemas']['EmailListResponseDto'];
export type EmailResponse = components['schemas']['EmailResponseDto'];
export type EmailCreatedResponse = components['schemas']['EmailCreatedResponseDto'];
export type SendEmailRequest = components['schemas']['SendEmailRequestDto'];
export type DraftEmailRequest = components['schemas']['DraftEmailRequestDto'];
export type UpdateEmailRequest = components['schemas']['UpdateEmailRequestDto'];
export type EmailAddress = components['schemas']['EmailAddressDto'];
export type ListEmailsQuery = operations['EmailController_list']['parameters']['query'];
