import { Network } from '.';
import { UploadInvalidMnemonicError, ErrorWithContext, getNetworkErrorContext } from './errors';
import { BinaryData, Crypto, EncryptFileFunction, UploadFileFunction } from './types';

export async function uploadFile(
  network: Network,
  crypto: Crypto,
  bucketId: string,
  mnemonic: string,
  fileSize: number,
  encryptFile: EncryptFileFunction,
  uploadFile: UploadFileFunction
): Promise<string> {
  let index: BinaryData;
  let iv: BinaryData;
  let key: BinaryData;

  try {
    const mnemonicIsValid = crypto.validateMnemonic(mnemonic);

    if (!mnemonicIsValid) {
      throw new UploadInvalidMnemonicError();
    }

    index = crypto.randomBytes(crypto.algorithm.ivSize);
    iv = index.slice(0, 16);
    key = await crypto.generateFileKey(mnemonic, bucketId, index);

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
  } catch (err) {
    const context = getNetworkErrorContext({
      bucketId,
      fileSize,
      user: network.credentials.username,
      pass: network.credentials.password,
      crypto: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        index: index! ? index.toString('hex') : 'none',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        iv: iv! ? iv.toString('hex') : 'none',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key: key! ? key.toString('hex') : 'none',
        mnemonic
      }
    }, err as Error);

    (err as ErrorWithContext).context = context;

    throw err;
  }
}
