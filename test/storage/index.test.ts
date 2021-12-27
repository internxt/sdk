import sinon from 'sinon';
import { Storage, StorageTypes } from '../../src';
import axios from 'axios';
import { randomFolderContentResponse } from './folderContentResponse.mother';
import { validResponse } from '../shared/response';
import { CreateFolderPayload, CreateFolderResponse } from '../../src/drive/storage/types';

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

  });

  describe('-> files', () => {

    describe('-> create file entry use case', () => {

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
