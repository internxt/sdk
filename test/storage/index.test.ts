import sinon from 'sinon';
import { Storage, StorageTypes } from '../../src';
import axios from 'axios';
import { emptyFolderContentResponse, randomFolderContentResponse } from './folderContentResponse.mother';
import { validResponse } from '../shared/response';
import {
  CreateFolderPayload,
  CreateFolderResponse, DriveFolderData,
  MoveFolderPayload,
  MoveFolderResponse,
  HashPath,
  UpdateFilePayload,
  DeleteFilePayload,
} from '../../src/drive/storage/types';
import { randomMoveFolderPayload } from './moveFolderPayload.mother';
import { randomMoveFilePayload } from './moveFilePayload.mother';
import { randomUpdateFolderMetadataPayload } from './updateFolderMetadataPayload.mother';

describe('# storage service tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('-> folders', () => {

    describe('get folder content', () => {

      it('Should return the expected elements', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client } = clientAndHeaders();
        sinon.stub(axios, 'get').resolves(validResponse(response));

        // Act
        const [promise, cancelToken] = client.getFolderContent(1);
        const body = await promise;

        // Assert
        expect(body.files).toHaveLength(2);
        expect(body.folders).toHaveLength(2);
      });

      it('Should cancel the request', async () => {
        // Arrange
        const { client } = clientAndHeaders();

        // Act
        const [promise, cancelToken] = client.getFolderContent(1);
        cancelToken.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrowError('My cancel message');
      });

    });

    describe('create folder entry', () => {

      it('Should call with correct params & return content', async () => {
        // Arrange
        const createFolderPayload: CreateFolderPayload = {
          folderName: 'ma-fol',
          parentFolderId: 34
        };
        const createFolderResponse: CreateFolderResponse = {
          bucket: 'bucket',
          createdAt: '',
          id: 2,
          name: 'zero',
          parentId: 0,
          updatedAt: '',
          userId: 1
        };
        const callStub = sinon.stub(axios, 'post').resolves(validResponse(createFolderResponse));
        const { client, headers } = clientAndHeaders();

        // Act
        const [promise, cancelTokenSource] = client.createFolder(createFolderPayload);
        const body = await promise;

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder',
          {
            parentFolderId: 34,
            folderName: 'ma-fol',
          },
          {
            cancelToken: expect.anything(),
            headers: headers
          }
        ]);
        expect(body).toEqual(createFolderResponse);
      });

      it('Should cancel the request', async () => {
        // Arrange
        const createFolderPayload: CreateFolderPayload = {
          folderName: 'ma-fol',
          parentFolderId: 34
        };
        const { client } = clientAndHeaders();

        // Act
        const [promise, cancelTokenSource] = client.createFolder(createFolderPayload);
        cancelTokenSource.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrowError('My cancel message');
      });

    });

    describe('move folder', () => {

      it('Should call bubble up the error', async () => {
        // Arrange
        const payload: MoveFolderPayload = randomMoveFolderPayload();
        sinon.stub(axios, 'post').rejects(new Error('first call error'));

        const { client } = clientAndHeaders();

        // Act
        const call = client.moveFolder(payload);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right params & return correct response', async () => {
        // Arrange
        const payload: MoveFolderPayload = randomMoveFolderPayload();
        const moveFolderResponse: MoveFolderResponse = {
          destination: 0,
          item: <DriveFolderData>{
            id: 1,
            bucket: 'bucket',
            color: 'red',
            createdAt: '',
            encrypt_version: '',
            icon: '',
            iconId: 1,
            icon_id: 1,
            isFolder: true,
            name: 'name',
            parentId: 1,
            parent_id: 1,
            updatedAt: '',
            userId: 1,
            user_id: 1,
          },
          moved: false
        };
        const callStub = sinon.stub(axios, 'post').resolves(validResponse(moveFolderResponse));
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.moveFolder(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/move/folder',
          {
            folderId: payload.folder.id,
            destination: payload.destinationFolderId,
          },
          {
            headers: headers
          }
        ]);
        expect(body).toEqual(moveFolderResponse);
      });

    });

    describe('update folder metadata', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        const payload = randomUpdateFolderMetadataPayload();
        const { client } = clientAndHeaders();
        sinon.stub(axios, 'post').rejects(new Error('first call error'));

        // Act
        const call = client.updateFolder(payload);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right params & return correct response', async () => {
        // Arrange
        const payload = randomUpdateFolderMetadataPayload();
        const callStub = sinon.stub(axios, 'post').resolves(validResponse({}));
        const { client, headers } = clientAndHeaders();

        // Act
        await client.updateFolder(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder/2/meta',
          {
            itemName: payload.changes.itemName,
            color: payload.changes.color,
            icon: payload.changes.icon,
          },
          {
            headers: headers
          }
        ]);
      });

    });

    describe('delete folder', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        sinon.stub(axios, 'delete').rejects(new Error('first call error'));
        const { client } = clientAndHeaders();

        // Act
        const call = client.deleteFolder(2);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right arguments & return control', async () => {
        // Arrange
        const callStub = sinon.stub(axios, 'delete').resolves(validResponse({}));
        const { client, headers } = clientAndHeaders();

        // Act
        await client.deleteFolder(2);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder/2',
          {
            headers: headers
          }
        ]);
      });

    });

  });

  describe('-> files', () => {

    describe('create file entry', () => {

      it('Should have all the correct params on call', async () => {
        // Arrange
        const callStub = sinon.stub(axios, 'post').resolves(validResponse({}));
        const { client, headers } = clientAndHeaders();
        const fileEntry: StorageTypes.FileEntry = {
          id: '1',
          type: 'type',
          name: 'xtz',
          size: 2,
          bucket: '',
          encrypt_version: '',
          folder_id: '',
        };

        // Act
        await client.createFileEntry(fileEntry);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/file',
          {
            fileId: '1',
            type: 'type',
            bucket: '',
            size: 2,
            folder_id: '',
            name: 'xtz',
            encrypt_version: '',
          },
          {
            headers: headers
          }
        ]);
      });

    });

    describe('update file metadata', () => {

      it('Should call bubble up the error', async () => {
        // Arrange
        const payload: UpdateFilePayload = {
          bucketId: '',
          destinationPath: '',
          fileId: '',
          metadata: {
            itemName: ''
          }
        };
        sinon.stub(axios, 'post').rejects(new Error('first call error'));
        const { client } = clientAndHeaders();

        // Act
        const call = client.updateFile(payload);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right params & return control', async () => {
        // Arrange
        const payload: UpdateFilePayload = {
          bucketId: 'bucket',
          destinationPath: 'x',
          fileId: '6',
          metadata: {
            itemName: 'new name'
          }
        };
        const callStub = sinon.stub(axios, 'post').resolves(validResponse({
          valid: true
        }));
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.updateFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/file/6/meta',
          {
            metadata: {
              itemName: 'new name'
            },
            bucketId: 'bucket',
            relativePath: 'x',
          },
          {
            headers: headers
          }
        ]);
        expect(body).toEqual({
          valid: true
        });
      });

    });

    describe('delete file', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        sinon.stub(axios, 'delete').rejects(new Error('first call error'));
        const { client } = clientAndHeaders();
        const payload: DeleteFilePayload = {
          fileId: 5,
          folderId: 2
        };

        // Act
        const call = client.deleteFile(payload);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right arguments and return control', async () => {
        // Arrange
        const callStub = sinon.stub(axios, 'delete').resolves(validResponse({}));
        const { client, headers } = clientAndHeaders();
        const payload: DeleteFilePayload = {
          fileId: 5,
          folderId: 2
        };

        // Act
        await client.deleteFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder/2/file/5',
          {
            headers: headers
          }
        ]);
      });

    });

    describe('move file', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        const payload = randomMoveFilePayload();
        const hashPath = () => '';
        sinon.stub(axios, 'post').rejects(new Error('first call error'));
        const { client } = clientAndHeaders();

        // Act
        const call = client.moveFile(payload, hashPath);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right arguments & return content', async () => {
        // Arrange
        const payload = randomMoveFilePayload();
        const hashPath = () => '+hash+';
        const callStub = sinon.stub(axios, 'post').resolves(validResponse({
          content: 'test'
        }));
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.moveFile(payload, hashPath);

        // Assert
        expect(body).toEqual({
          content: 'test'
        });
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/move/file',
          {
            fileId: payload.fileId,
            destination: payload.destination,
            relativePath: '+hash+',
            bucketId: payload.bucketId,
          },
          {
            headers: headers
          }
        ]);
      });

    });

    describe('get recent files', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        sinon.stub(axios, 'get').rejects(new Error('custom'));
        const { client } = clientAndHeaders();

        // Act
        const call = client.recentFiles(5);

        // Assert
        await expect(call).rejects.toThrowError('custom');
      });

      it('Should be called with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(axios, 'get').resolves(validResponse({
          files: []
        }));
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.recentFiles(5);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/recents?limit=5',
          {
            headers: headers
          }
        ]);
        expect(body).toEqual({
          files: []
        });
      });

    });

  });

});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
  mnemonic = 'nemo'
): {
  client: Storage,
  headers: object
} {
  const client = new Storage(axios, apiUrl, clientName, clientVersion, token, mnemonic);
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'internxt-version': clientVersion,
    'internxt-client': clientName,
    'internxt-mnemonic': mnemonic,
    'Authorization': `Bearer ${token}`,
  };
  return { client, headers };
}
