import { Network } from '.';
import {
  UploadIdNotReceivedFromNetworkError,
  UploadInvalidMnemonicError,
  UrlsNotReceivedFromNetworkError,
  ErrorWithContext,
  getNetworkErrorContext,
  UrlNotReceivedFromNetworkError,
} from './errors';
import { BinaryData, Crypto, EncryptFileFunction, UploadFileFunction, UploadFileMultipartFunction } from './types';

export async function uploadFile(
  network: Network,
  crypto: Crypto,
  bucketId: string,
  mnemonic: string,
  fileSize: number,
  encryptFile: EncryptFileFunction,
  uploadFile: UploadFileFunction,
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
      uploads: [
        {
          index: 0,
          size: fileSize,
        },
      ],
    });

    const [{ url, uuid }] = uploads;

    if (!url) {
      throw new UrlNotReceivedFromNetworkError();
    }

    await encryptFile(crypto.algorithm.type, key, iv);
    const hash = await uploadFile(url);

    const finishUploadPayload = {
      index: index.toString('hex'),
      shards: [{ hash, uuid }],
    };

    const finishUploadResponse = await network.finishUpload(bucketId, finishUploadPayload);

    return finishUploadResponse.id;
  } catch (err) {
    const context = getNetworkErrorContext(
      {
        bucketId,
        fileSize,
        user: network.credentials.username,
        pass: network.credentials.password,
        crypto: {
          index: index! ? index.toString('hex') : 'none',
          iv: iv! ? iv.toString('hex') : 'none',
          key: key! ? key.toString('hex') : 'none',
          mnemonic,
        },
      },
      err as Error,
    );

    (err as ErrorWithContext).context = context;

    throw err;
  }
}

export async function uploadMultipartFile(
  network: Network,
  crypto: Crypto,
  bucketId: string,
  mnemonic: string,
  fileSize: number,
  encryptFile: EncryptFileFunction,
  uploadMultiparts: UploadFileMultipartFunction,
  parts = 1,
): Promise<string> {
  const mnemonicIsValid = crypto.validateMnemonic(mnemonic);

  if (!mnemonicIsValid) {
    throw new UploadInvalidMnemonicError();
  }

  const index = crypto.randomBytes(crypto.algorithm.ivSize);
  const iv = index.slice(0, 16);
  const key = await crypto.generateFileKey(mnemonic, bucketId, index);

  const { uploads } = await network.startUpload(
    bucketId,
    {
      uploads: [
        {
          index: 0,
          size: fileSize,
        },
      ],
    },
    parts,
  );

  const [{ urls, uuid, UploadId }] = uploads;

  if (!urls) {
    throw new UrlsNotReceivedFromNetworkError();
  }
  if (!UploadId) {
    throw new UploadIdNotReceivedFromNetworkError();
  }

  await encryptFile(crypto.algorithm.type, key, iv);
  const { hash, parts: uploadedPartsReference } = await uploadMultiparts(urls);

  const finishUploadPayload = {
    index: index.toString('hex'),
    shards: [{ hash, uuid, UploadId, parts: uploadedPartsReference }],
  };

  const finishUploadResponse = await network.finishUpload(bucketId, finishUploadPayload);

  return finishUploadResponse.id;
}
