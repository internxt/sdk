import sinon from 'sinon';
import { Storage, StorageTypes } from '../../src';
import axios from 'axios';
import { emptyFolderContentResponse, randomFolderContentResponse } from './folderContentResponse.mother';
import { validResponse } from '../shared/response';
import {
  CreateFolderPayload,
  CreateFolderResponse, DriveFolderData,
  MoveFolderPayload,
  MoveFolderResponse, RenameFileInNetwork
} from '../../src/drive/storage/types';
import { randomMoveFolderPayload } from './moveFolderPayload.mother';

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
        const renameFunction: RenameFileInNetwork = () => null;
        const callStub = sinon.stub(axios, 'post')
          .onFirstCall()
          .rejects(new Error('first call error'));

        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');

        // Act
        const call = storageClient.moveFolder(payload, renameFunction);

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
        const renameFunction: RenameFileInNetwork = () => null;
        sinon.stub(axios, 'post').resolves(validResponse(moveFolderResponse));
        sinon.stub(axios, 'get').resolves(validResponse(folderContentResponse));
        const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
        const spy = sinon.spy(storageClient, 'getFolderContent');

        // Act
        const body = await storageClient.moveFolder(payload, renameFunction);

        // Assert
        expect(spy.callCount).toEqual(1);
        expect(body).toEqual(moveFolderResponse);
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

  });

});
