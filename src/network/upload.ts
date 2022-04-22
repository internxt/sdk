import { Network } from '.';
import { UploadInvalidMnemonicError } from './errors';
import { Crypto, EncryptFileFunction, UploadFileFunction } from './types';

export async function uploadFile(
  network: Network,
  crypto: Crypto,
  bucketId: string,
  mnemonic: string,
  fileSize: number,
  encryptFile: EncryptFileFunction,
  uploadFile: UploadFileFunction
): Promise<string> {
  const mnemonicIsValid = crypto.validateMnemonic(mnemonic);

  if (!mnemonicIsValid) {
    throw new UploadInvalidMnemonicError();
  }

  const index = crypto.randomBytes(crypto.algorithm.ivSize);
  const iv = index.slice(0, 16);
  const key = await crypto.generateFileKey(mnemonic, bucketId, index);

  const { uploads } = await network.startUpload(bucketId, {
    uploads: [{
      index: 0,
      size: fileSize
    }]
  });

  const [{ url, uuid }] = uploads;

  await encryptFile(crypto.algorithm.type, key, iv);
  const hash = await uploadFile(url);

  const finishUploadPayload = {
    index: index.toString('hex'),
    shards: [{ hash, uuid }]
  };

  const finishUploadResponse = await network.finishUpload(bucketId, finishUploadPayload);

  return finishUploadResponse.id;
}
