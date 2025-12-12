import crypto from 'crypto';
import * as bip39 from 'bip39';
import {
  ALGORITHMS,
  SymmetricCryptoAlgorithm,
  Crypto,
  BinaryData,
  BinaryDataEncoding,
} from '../../../src/network/types';


export async function generateFileKey(mnemonic: string, bucketId: string, index: BinaryData | string): Promise<Buffer> {
  const indexBuffer = typeof index === 'string' ? Buffer.from(index, 'hex') : (index as Buffer);

  const seed = await bip39.mnemonicToSeed(mnemonic);

  const bucketIdBuffer = Buffer.from(bucketId, 'hex');
  const bucketKeyHash = crypto.createHash('sha512').update(seed).update(bucketIdBuffer).digest();

  const bucketKey32 = bucketKeyHash.subarray(0, 32);
  const fileKeyHash = crypto.createHash('sha512').update(bucketKey32).update(indexBuffer).digest();

  return fileKeyHash.subarray(0, 32);
}

export function encryptBuffer(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

export function decryptBuffer(encryptedData: Buffer, key: Buffer, iv: Buffer): Buffer {
  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

export function toBinaryData(input: string, encoding: BinaryDataEncoding | 'hex'): Buffer {
  return Buffer.from(input, encoding as BufferEncoding);
}

export function createCryptoProvider(): Crypto {
  return {
    algorithm: ALGORITHMS[SymmetricCryptoAlgorithm.AES256CTR],
    validateMnemonic: (mnemonic: string) => bip39.validateMnemonic(mnemonic),
    randomBytes: (bytesLength: number) => crypto.randomBytes(bytesLength),
    generateFileKey,
  };
}
