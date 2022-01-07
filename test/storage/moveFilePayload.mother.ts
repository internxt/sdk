import { MoveFilePayload } from '../../src/drive/storage/types';

export function randomMoveFilePayload(): MoveFilePayload {
  return {
    fileId: 'xtr-std-asd',
    destination: 0,
    destinationPath: 'x',
    bucketId: ''
  };
}