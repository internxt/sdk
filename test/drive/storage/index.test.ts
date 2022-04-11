import sinon from 'sinon';
import { Storage, StorageTypes } from '../../../src/drive';
import { randomFolderContentResponse } from './mothers/folderContentResponse.mother';
import {
  CreateFolderPayload,
  CreateFolderResponse, DriveFolderData,
  MoveFolderPayload,
  MoveFolderResponse,
  UpdateFilePayload,
  DeleteFilePayload, EncryptionVersion,
} from '../../../src/drive/storage/types';
import { randomMoveFolderPayload } from './mothers/moveFolderPayload.mother';
import { randomUpdateFolderMetadataPayload } from './mothers/updateFolderMetadataPayload.mother';
import { randomMoveFilePayload } from './mothers/moveFilePayload.mother';
import { headersWithTokenAndMnemonic } from '../../../src/shared/headers';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('# storage service tests', () => {

  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('-> folders', () => {

    describe('get folder content', () => {

      it('Should return the expected elements', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null
          }
        });

        // Act
        const [promise, requestCanceler] = client.getFolderContent(1);
        const body = await promise;

        // Assert
        expect(body.files).toHaveLength(2);
        expect(body.children).toHaveLength(2);
      });

      it('Should cancel the request', async () => {
        // Arrange
        const { client } = clientAndHeaders();

        // Act
        const [promise, requestCanceler] = client.getFolderContent(1);
        requestCanceler.cancel('My cancel message');

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
        const callStub = sinon.stub(httpClient, 'postCancellable').returns({
          promise: Promise.resolve(createFolderResponse),
          requestCanceler: {
            cancel: () => null
          }
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const [promise, requestCanceler] = client.createFolder(createFolderPayload);
        const body = await promise;

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/folder',
          {
            parentFolderId: 34,
            folderName: 'ma-fol',
          },
          headers
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
        const [promise, requestCanceler] = client.createFolder(createFolderPayload);
        requestCanceler.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrowError('My cancel message');
      });

    });

    describe('move folder', () => {

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
        const callStub = sinon.stub(httpClient, 'post').resolves(moveFolderResponse);
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.moveFolder(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/move/folder',
          {
            folderId: payload.folderId,
            destination: payload.destinationFolderId,
          },
          headers
        ]);
        expect(body).toEqual(moveFolderResponse);
      });

    });

    describe('update folder metadata', () => {

      it('Should call with right params & return correct response', async () => {
        // Arrange
        const payload = randomUpdateFolderMetadataPayload();
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'post').resolves({});

        // Act
        await client.updateFolder(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/folder/2/meta',
          {
            metadata: {
              itemName: payload.changes.itemName,
              color: payload.changes.color,
              icon: payload.changes.icon,
            }
          },
          headers
        ]);
      });

    });

    describe('delete folder', () => {

      it('Should call with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'delete').resolves({
          valid: true
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.deleteFolder(2);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/folder/2',
          headers
        ]);
        expect(body).toEqual({
          valid: true
        });
      });

    });

    describe('folder size', () => {

      it('Should call with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'get').resolves({
          size: 10
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.getFolderSize(2);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/folder/size/2',
          headers
        ]);
        expect(body).toEqual(10);
      });

    });

  });

  describe('-> files', () => {

    describe('create file entry', () => {

      it('Should have all the correct params on call', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'post').resolves({});
        const { client, headers } = clientAndHeaders();
        const fileEntry: StorageTypes.FileEntry = {
          id: '1',
          type: 'type',
          name: 'xtz',
          size: 2,
          bucket: '',
          encrypt_version: EncryptionVersion.Aes03,
          folder_id: 0,
        };

        // Act
        await client.createFileEntry(fileEntry);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/file',
          {
            file: {
              fileId: fileEntry.id,
              type: fileEntry.type,
              bucket: fileEntry.bucket,
              size: fileEntry.size,
              folder_id: fileEntry.folder_id,
              name: fileEntry.name,
              encrypt_version: fileEntry.encrypt_version,
            }
          },
          headers
        ]);
      });

    });

    describe('update file metadata', () => {

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
        const callStub = sinon.stub(httpClient, 'post').resolves({
          valid: true
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.updateFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/file/6/meta',
          {
            metadata: {
              itemName: 'new name'
            },
            bucketId: 'bucket',
            relativePath: 'x',
          },
          headers
        ]);
        expect(body).toEqual({
          valid: true
        });
      });

    });

    describe('delete file', () => {

      it('Should call with right arguments and return control', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'delete').resolves({
          valid: true
        });
        const { client, headers } = clientAndHeaders();
        const payload: DeleteFilePayload = {
          fileId: 5,
          folderId: 2
        };

        // Act
        const body = await client.deleteFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/folder/2/file/5',
          headers
        ]);
        expect(body).toEqual({
          valid: true
        });
      });

    });

    describe('move file', () => {

      it('Should call with right arguments & return content', async () => {
        // Arrange
        const payload = randomMoveFilePayload();
        const callStub = sinon.stub(httpClient, 'post').resolves({
          content: 'test'
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.moveFile(payload);

        // Assert
        expect(body).toEqual({
          content: 'test'
        });
        expect(callStub.firstCall.args).toEqual([
          '/storage/move/file',
          {
            fileId: payload.fileId,
            destination: payload.destination,
            relativePath: payload.destinationPath,
            bucketId: payload.bucketId,
          },
          headers
        ]);
      });

    });

    describe('get recent files', () => {

      it('Should be called with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'get').resolves({
          files: []
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.getRecentFiles(5);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/recents?limit=5',
          headers
        ]);
        expect(body).toEqual({
          files: []
        });
      });

    });

  });

  describe('-> quotas', () => {

    describe('space usage', () => {

      it('should call with right params & return response', async () => {
        // Arrange
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'get').resolves({
          total: 10
        });

        // Act
        const body = await client.spaceUsage();

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/usage',
          headers
        ]);
        expect(body).toEqual({
          total: 10
        });
      });

    });

    describe('space limit', () => {

      it('should call with right params & return response', async () => {
        // Arrange
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'get').resolves({
          total: 10
        });

        // Act
        const body = await client.spaceLimit();

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/limit',
          headers
        ]);
        expect(body).toEqual({
          total: 10
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
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
    mnemonic: mnemonic,
  };
  const client = Storage.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
  return { client, headers };
}
