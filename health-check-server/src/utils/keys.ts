import * as openpgp from 'openpgp';
import kemBuilder from '@dashlane/pqc-kem-kyber512-node';
import { Keys } from '../../../src/auth';
import { config } from '../config';
import { encryptWithPassword } from './crypto';

/**
 * Generates new ECC and Kyber key pairs for user registration
 * This matches the behavior of drive-web's generateNewKeys
 */
export async function generateNewKeys(): Promise<{
  privateKeyArmored: string;
  publicKeyArmored: string;
  revocationCertificate: string;
  publicKyberKeyBase64: string;
  privateKyberKeyBase64: string;
}> {
  const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
    userIDs: [{ email: 'inxt@inxt.com' }],
    curve: 'ed25519',
  });

  const kem = await kemBuilder();
  const { publicKey: publicKyberKey, privateKey: privateKyberKey } = await kem.keypair();

  return {
    privateKeyArmored: privateKey,
    publicKeyArmored: Buffer.from(publicKey).toString('base64'),
    revocationCertificate: Buffer.from(revocationCertificate).toString('base64'),
    publicKyberKeyBase64: Buffer.from(publicKyberKey).toString('base64'),
    privateKyberKeyBase64: Buffer.from(privateKyberKey).toString('base64'),
  };
}

/**
 * Generates and encrypts all keys needed for user registration
 * This matches the behavior of drive-web's getKeys function
 * @param password User's password used to encrypt private keys
 */
export async function getKeys(password: string): Promise<Keys> {
  const { privateKeyArmored, publicKeyArmored, revocationCertificate, publicKyberKeyBase64, privateKyberKeyBase64 } =
    await generateNewKeys();

  const encPrivateKey = encryptWithPassword(privateKeyArmored, password, config.magicIv, config.magicSalt);
  const encPrivateKyberKey = encryptWithPassword(privateKyberKeyBase64, password, config.magicIv, config.magicSalt);

  const keys: Keys = {
    privateKeyEncrypted: encPrivateKey,
    publicKey: publicKeyArmored,
    revocationCertificate: revocationCertificate,
    ecc: {
      privateKeyEncrypted: encPrivateKey,
      publicKey: publicKeyArmored,
    },
    kyber: {
      publicKey: publicKyberKeyBase64,
      privateKeyEncrypted: encPrivateKyberKey,
    },
  };

  return keys;
}
