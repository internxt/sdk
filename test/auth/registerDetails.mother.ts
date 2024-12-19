import { Keys, RegisterDetails } from '../../src';

export function emptyRegisterDetails(): RegisterDetails {
  const keys: Keys = {
    privateKeyEncrypted: '',
    publicKey: '',
    revocationCertificate: '',
    ecc: {
      publicKey: '',
      privateKeyEncrypted: '',
    },
    kyber: {
      publicKey: '',
      privateKeyEncrypted: '',
    },
  };
  return {
    name: '',
    lastname: '',
    email: '',
    password: '',
    mnemonic: '',
    salt: '',
    keys: keys,
    captcha: '',
    referrer: undefined,
    referral: undefined,
  };
}
