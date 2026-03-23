import {
  EncryptedKeystore,
  HybridEncryptedEmail,
  PwdProtectedEmail,
  HybridKeyPair,
  Email,
  EmailBody,
  createEncryptionAndRecoveryKeystores,
  openEncryptionKeystore,
  RecipientWithPublicKey,
  encryptEmailHybridForMultipleRecipients,
  decryptEmailHybrid,
  createPwdProtectedEmail,
  decryptPwdProtectedEmail,
  openRecoveryKeystore,
  UTF8ToUint8,
} from 'internxt-crypto';

/**
 * Creates recovery and encryption keystores for a user
 *
 * @param userEmail - The email of the user
 * @param baseKey - The secret key of the user
 * @returns The created keystores, keys and recovery codes for opening recovery keystore
 */
export async function createKeystores(
  userEmail: string,
  baseKey: Uint8Array,
): Promise<{
  encryptionKeystore: EncryptedKeystore;
  recoveryKeystore: EncryptedKeystore;
  recoveryCodes: string;
  keys: HybridKeyPair;
}> {
  return createEncryptionAndRecoveryKeystores(userEmail, baseKey);
}

/**
 * Opens user's keystore and returns the keys
 *
 * @param keystore - The encrypted keystore
 * @param baseKey - The secret key of the user
 * @returns The keys of the user
 */
export async function openKeystore(keystore: EncryptedKeystore, baseKey: Uint8Array): Promise<HybridKeyPair> {
  return openEncryptionKeystore(keystore, baseKey);
}

/**
 * Recovery of user's keys using recovery keystore
 *
 * @param keystore - The recovery keystore
 * @param recoveryCodes - The recovery codes of the user
 * @returns The keys of the user
 */
export async function recoverKeys(keystore: EncryptedKeystore, recoveryCodes: string): Promise<HybridKeyPair> {
  return openRecoveryKeystore(recoveryCodes, keystore);
}

/**
 * Encrypts the email
 *
 * @param email - The email to encrypt
 * @param recipients - The recipients of the email
 * @param aux - The optional auxilary data to encrypt together with the email (e.g. email sender)
 * @returns The encrypted emails for each recipient
 */
export async function encryptEmail(
  email: Email,
  recipients: RecipientWithPublicKey[],
  aux?: string,
): Promise<HybridEncryptedEmail[]> {
  const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
  return encryptEmailHybridForMultipleRecipients(email.body, recipients, auxArray);
}

/**
 * Password-protects the email
 *
 * @param email - The email to password-protect
 * @param pwd - The password to protect the email with
 * @param aux - The optional auxilary data to encrypt together with the email (e.g. email sender)
 * @returns The password-protected email
 */
export async function passwordProtectAndSendEmail(email: Email, pwd: string, aux?: string): Promise<PwdProtectedEmail> {
  const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
  return createPwdProtectedEmail(email.body, pwd, auxArray);
}

/**
 * Opens the password-protected email
 *
 * @param email - The password-protected email
 * @param pwd - The shared password
 * @param aux - The optional auxilary data that was encrypted together with the email (e.g. email sender)
 * @returns The decrypted email body
 */
export async function openPasswordProtectedEmail(
  email: PwdProtectedEmail,
  pwd: string,
  aux?: string,
): Promise<EmailBody> {
  const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
  return decryptPwdProtectedEmail(email, pwd, auxArray);
}

/**
 * Decrypt the email
 *
 * @param email - The encrypted email
 * @param recipientPrivateKeys - The private keys of the email recipient
 * @param aux - The optional auxilary data that was encrypted together with the email (e.g. email sender)
 * @returns The decrypted email body
 */
export async function decryptEmail(
  email: HybridEncryptedEmail,
  recipientPrivateKeys: Uint8Array,
  aux?: string,
): Promise<EmailBody> {
  const auxArray = aux ? UTF8ToUint8(aux) : new Uint8Array();
  return decryptEmailHybrid(email, recipientPrivateKeys, auxArray);
}
