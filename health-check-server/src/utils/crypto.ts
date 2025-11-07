import CryptoJS from 'crypto-js';
import { config } from '../config';

interface PassObjectInterface {
  salt?: string | null;
  password: string;
}

function passToHash(passObject: PassObjectInterface): { salt: string; hash: string } {
  const salt = passObject.salt ? CryptoJS.enc.Hex.parse(passObject.salt) : CryptoJS.lib.WordArray.random(128 / 8);
  const hash = CryptoJS.PBKDF2(passObject.password, salt, { keySize: 256 / 32, iterations: 10000 });
  const hashedObjetc = {
    salt: salt.toString(),
    hash: hash.toString(),
  };

  return hashedObjetc;
}

function encryptText(textToEncrypt: string): string {
  return encryptTextWithKey(textToEncrypt, config.cryptoSecret);
}

function decryptText(encryptedText: string): string {
  return decryptTextWithKey(encryptedText, config.cryptoSecret);
}

function encryptTextWithKey(textToEncrypt: string, keyToEncrypt: string): string {
  const bytes = CryptoJS.AES.encrypt(textToEncrypt, keyToEncrypt).toString();
  const text64 = CryptoJS.enc.Base64.parse(bytes);

  return text64.toString(CryptoJS.enc.Hex);
}

function decryptTextWithKey(encryptedText: string, keyToDecrypt: string): string {
  if (!keyToDecrypt) {
    throw new Error('No key defined. Check .env file');
  }

  const reb = CryptoJS.enc.Hex.parse(encryptedText);
  const bytes = CryptoJS.AES.decrypt(reb.toString(CryptoJS.enc.Base64), keyToDecrypt);

  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypts text using AES with password and custom IV/salt
 * This matches the behavior of @internxt/lib's aes.encrypt
 * @param text Text to encrypt
 * @param password Password for encryption
 * @param iv Initialization vector
 * @param salt Salt for key derivation
 */
function encryptWithPassword(text: string, password: string, iv: string, salt: string): string {
  // Parse IV and salt as hex strings
  const ivWordArray = CryptoJS.enc.Hex.parse(iv);
  const saltWordArray = CryptoJS.enc.Hex.parse(salt);

  // Derive key from password using PBKDF2
  const key = CryptoJS.PBKDF2(password, saltWordArray, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  // Encrypt the text
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Return as base64
  return encrypted.toString();
}

export { passToHash, encryptText, decryptText, encryptTextWithKey, decryptTextWithKey, encryptWithPassword };