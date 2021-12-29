import sinon from 'sinon';
import { Storage, StorageTypes } from '../../src';
import axios from 'axios';
import { emptyFolderContentResponse, randomFolderContentResponse } from './folderContentResponse.mother';
import { validResponse } from '../shared/response';
import {
  CreateFolderPayload,
  CreateFolderResponse, DriveFolderData,
  MoveFolderPayload,
  MoveFolderResponse, HashPath, UpdateFolderMetadataPayload, UpdateFilePayload, DeleteFilePayload, MoveFilePayload
} from '../../src/drive/storage/types';
import { randomMoveFolderPayload } from './moveFolderPayload.mother';
import { randomMoveFilePayload } from './moveFilePayload.mother';

describe('# storage service tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('-> folders', () => {

    describe('get folder content', () => {

      it('Should return the expected elements', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
        sinon.stub(axios, 'get').resolves(validResponse(response));

        // Act
        const [promise, cancelToken] = storageClient.getFolderContent(1);
        const body = await promise;

        // Assert
        expect(body.files).toHaveLength(2);
        expect(body.folders).toHaveLength(2);
      });

      it('Should cancel the request', async () => {
        // Arrange
        const storageClient = new Storage(axios, '', '', '', '');

        // Act
        const [promise, cancelToken] = storageClient.getFolderContent(1);
        cancelToken.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrowError('My cancel message');
      });

    });

    describe('create folder entry', () => {

      it('Should call with correct params', async () => {
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
        const callStub = sinon.stub(axios, 'post')
          .resolves(validResponse(createFolderResponse));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const [promise, cancelTokenSource] = storageClient.createFolder(createFolderPayload);
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
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
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
        const storageClient = new Storage(axios, '', '', '', '');

        // Act
        const [promise, cancelTokenSource] = storageClient.createFolder(createFolderPayload);
        cancelTokenSource.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrowError('My cancel message');
      });

    });

    describe('move folder', () => {

      it('Should call with right arguments & bubble up the error', async () => {
        // Arrange
        const payload: MoveFolderPayload = randomMoveFolderPayload();
        const hashPath: HashPath = () => '';
        const callStub = sinon.stub(axios, 'post')
          .onFirstCall()
          .rejects(new Error('first call error'));

        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const call = storageClient.moveFolder(payload, hashPath);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/move/folder',
          {
            folderId: payload.folder.id,
            destination: payload.destinationFolderId,
          },
          {
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
          }
        ]);
      });

      it('Should call for details one time & return correct response', async () => {
        // Arrange
        const payload: MoveFolderPayload = randomMoveFolderPayload();
        const folderContentResponse = emptyFolderContentResponse();
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
        const hashPath: HashPath = () => '';
        sinon.stub(axios, 'post').resolves(validResponse(moveFolderResponse));
        sinon.stub(axios, 'get').resolves(validResponse(folderContentResponse));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
        const spy = sinon.spy(storageClient, 'getFolderContent');

        // Act
        const body = await storageClient.moveFolder(payload, hashPath);

        // Assert
        expect(spy.callCount).toEqual(1);
        expect(body).toEqual(moveFolderResponse);
      });

    });

    describe('update folder metadata', () => {

      it('Should call with right arguments & bubble up the error', async () => {
        // Arrange
        const payload: UpdateFolderMetadataPayload = {
          bucketId: '',
          folderId: 2,
          destinationPath: '',
          changes: {
            itemName: 'new name',
            color: 'new color',
            icon: 'new icon',
          },
        };
        const hashPath: HashPath = () => '';
        const callStub = sinon.stub(axios, 'post')
          .rejects(new Error('first call error'));

        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const call = storageClient.updateFolder(payload, hashPath);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder/2/meta',
          {
            itemName: 'new name',
            color: 'new color',
            icon: 'new icon',
          },
          {
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
          }
        ]);
      });

      it('Should call for details one time & return correct response', async () => {
        // Arrange
        const payload: UpdateFolderMetadataPayload = {
          bucketId: '',
          folderId: 2,
          destinationPath: '',
          changes: {
            itemName: 'new name',
            color: 'new color',
            icon: 'new icon',
          },
        };
        const folderContentResponse = randomFolderContentResponse(0, 3);
        const hashPath: HashPath = () => '';
        sinon.stub(axios, 'post').resolves(validResponse({}));
        sinon.stub(axios, 'get').resolves(validResponse(folderContentResponse));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
        const spyFolder = sinon.spy(storageClient, 'getFolderContent');
        const spyFiles = sinon.spy(storageClient as any, 'updateFileReference');

        // Act
        await storageClient.updateFolder(payload, hashPath);

        // Assert
        expect(spyFolder.callCount).toEqual(1);
        expect(spyFiles.callCount).toEqual(3);
      });

    });

    describe('delete folder', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        sinon.stub(axios, 'delete').rejects(new Error('first call error'));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const call = storageClient.deleteFolder(2);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right arguments & return control', async () => {
        // Arrange
        const callStub = sinon.stub(axios, 'delete')
          .resolves(validResponse({}));

        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        await storageClient.deleteFolder(2);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder/2',
          {
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
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
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
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
        await storageClient.createFileEntry(fileEntry);

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
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
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
        const hashPath: HashPath = () => '';
        sinon.stub(axios, 'post').rejects(new Error('first call error'));

        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const call = storageClient.updateFile(payload, hashPath);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right params & return control', async () => {
        // Arrange
        const payload: UpdateFilePayload = {
          bucketId: 'bucket',
          destinationPath: '',
          fileId: '6',
          metadata: {
            itemName: 'new name'
          }
        };
        const hashPath: HashPath = () => 'hashed_path';
        const callStub = sinon.stub(axios, 'post').resolves(validResponse({}));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        await storageClient.updateFile(payload, hashPath);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/file/6/meta',
          {
            metadata: {
              itemName: 'new name'
            },
            bucketId: 'bucket',
            relativePath: 'hashed_path',
          },
          {
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
          }
        ]);
      });

    });

    describe('delete file', () => {

      it('Should bubble up the error', async () => {
        // Arrange
        sinon.stub(axios, 'delete').rejects(new Error('first call error'));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
        const payload: DeleteFilePayload = {
          fileId: 5,
          folderId: 2
        };

        // Act
        const call = storageClient.deleteFile(payload);

        // Assert
        await expect(call).rejects.toThrowError('first call error');
      });

      it('Should call with right arguments and return control', async () => {
        // Arrange
        const callStub = sinon.stub(axios, 'delete').resolves(validResponse({}));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
        const payload: DeleteFilePayload = {
          fileId: 5,
          folderId: 2
        };

        // Act
        await storageClient.deleteFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/api/storage/folder/2/file/5',
          {
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
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
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const call = storageClient.moveFile(payload, hashPath);

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
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const body = await storageClient.moveFile(payload, hashPath);

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
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'internxt-version': '0.1',
              'internxt-client': 'c-name',
              'Authorization': 'Bearer my-token',
            }
          }
        ]);
      });

    });

  });

});
