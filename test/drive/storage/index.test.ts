import sinon from 'sinon';
import { v4 } from 'uuid';
import { Storage, StorageTypes } from '../../../src/drive';
import {
  CreateFolderPayload,
  CreateFolderResponse,
  DeleteFilePayload,
  DriveFolderData,
  EncryptionVersion,
  FetchPaginatedFolderContentResponse,
  MoveFolderPayload,
  MoveFolderResponse,
  UpdateFilePayload,
} from '../../../src/drive/storage/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { headersWithToken } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';
import { randomFileData } from './mothers/fileData.mother';
import {
  randomFolderContentResponse,
  randomSubfilesResponse,
  randomSubfoldersResponse,
} from './mothers/folderContentResponse.mother';
import { randomMoveFilePayload } from './mothers/moveFilePayload.mother';
import { randomMoveFolderPayload } from './mothers/moveFolderPayload.mother';
import { randomUpdateFolderMetadataPayload } from './mothers/updateFolderMetadataPayload.mother';

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
      it('Should return the expected elements, when getFolderContent is called', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null,
          },
        });

        // Act
        const [promise, requestCanceler] = client.getFolderContent(1);
        const body = await promise;

        // Assert
        expect(body.files).toHaveLength(2);
        expect(body.children).toHaveLength(2);
      });

      it('Should return the expected elements, when getFolderFolders is called', async () => {
        // Arrange
        const folderId = 1;
        const subFolder1 = randomFolderContentResponse(4, 5);
        const subFolder2 = randomFolderContentResponse(3, 1);
        const response: FetchPaginatedFolderContentResponse = {
          result: [
            { ...subFolder1, type: 'folder' },
            { ...subFolder2, type: 'folder' },
          ],
        };
        const { client, headers } = clientAndHeaders();
        sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const getFolderFoldersStub = jest.spyOn(httpClient, 'getCancellable');

        // Act
        const [promise] = client.getFolderFolders(folderId);
        const body = await promise;

        // Assert
        expect(body.result).toHaveLength(2);
        expect(body.result[0].children).toHaveLength(4);
        expect(body.result[0].files).toHaveLength(5);
        expect(body.result[1].children).toHaveLength(3);
        expect(body.result[1].files).toHaveLength(1);
        expect(getFolderFoldersStub).toHaveBeenCalledWith(`folders/${folderId}/folders/?offset=0&limit=50`, headers);
      });

      it('Should return the expected elements, when getFolderFiles is called', async () => {
        // Arrange
        const folderId = 345;
        const subFolder1 = randomFolderContentResponse(1, 2);
        const subFolder2 = randomFolderContentResponse(6, 8);
        const response: FetchPaginatedFolderContentResponse = {
          result: [
            { ...subFolder1, type: 'file' },
            { ...subFolder2, type: 'file' },
          ],
        };
        const { client, headers } = clientAndHeaders();
        sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const getFolderFoldersStub = jest.spyOn(httpClient, 'getCancellable');

        // Act
        const [promise] = client.getFolderFiles(folderId);
        const body = await promise;

        // Assert
        expect(body.result).toHaveLength(2);
        expect(body.result[0].children).toHaveLength(1);
        expect(body.result[0].files).toHaveLength(2);
        expect(body.result[1].children).toHaveLength(6);
        expect(body.result[1].files).toHaveLength(8);
        expect(getFolderFoldersStub).toHaveBeenCalledWith(`folders/${folderId}/files/?offset=0&limit=50`, headers);
      });

      it('Should return the expected elements, when getFolderFilesByUuid is called', async () => {
        // Arrange
        const responseSubfiles = randomSubfilesResponse(3);
        const randomUUID = v4();
        const { client, headers } = clientAndHeaders();
        sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(responseSubfiles),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const getFolderContentFilesStub = jest.spyOn(httpClient, 'getCancellable');

        // Act
        const [promise] = client.getFolderFilesByUuid(randomUUID);
        const body = await promise;

        // Assert
        expect(body.files).toHaveLength(3);
        expect(getFolderContentFilesStub).toHaveBeenCalledWith(
          `folders/content/${randomUUID}/files/?offset=0&limit=50`,
          headers,
        );
      });

      it('Should return the expected elements, when getFolderFoldersByUuid is called', async () => {
        // Arrange
        const randomUUID = v4();
        const responseSubfolders = randomSubfoldersResponse(4);
        const { client, headers } = clientAndHeaders();

        sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(responseSubfolders),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const getFolderContentFoldersStub = jest.spyOn(httpClient, 'getCancellable');

        // Act
        const [promise] = client.getFolderFoldersByUuid(randomUUID);
        const body = await promise;

        // Assert
        expect(body.folders).toHaveLength(4);
        expect(getFolderContentFoldersStub).toHaveBeenCalledWith(
          `folders/content/${randomUUID}/folders/?offset=0&limit=50`,
          headers,
        );
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

      it('Should return the expected elements with trash', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null,
          },
        });

        // Act
        const [promise, requestCanceler] = client.getFolderContent(1, true);
        const body = await promise;

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/v2/folder/1/?trash=true', headers]);
        expect(body.files).toHaveLength(2);
        expect(body.children).toHaveLength(2);
      });
    });

    describe('create folder entry', () => {
      it('Should call with correct params & return content', async () => {
        // Arrange
        const createFolderPayload: CreateFolderPayload = {
          folderName: 'ma-fol',
          parentFolderId: 34,
        };
        const createFolderResponse: CreateFolderResponse = {
          bucket: 'bucket',
          createdAt: '',
          id: 2,
          name: 'zero',
          plain_name: 'ma-fol',
          parentUuid: v4(),
          parentId: 0,
          updatedAt: '',
          userId: 1,
          uuid: '1234-5678-1234-5678',
        };
        const callStub = sinon.stub(httpClient, 'postCancellable').returns({
          promise: Promise.resolve(createFolderResponse),
          requestCanceler: {
            cancel: () => null,
          },
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
          headers,
        ]);
        expect(body).toEqual(createFolderResponse);
      });

      it('Should cancel the request', async () => {
        // Arrange
        const createFolderPayload: CreateFolderPayload = {
          folderName: 'ma-fol',
          parentFolderId: 34,
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
            name: 'name',
            parentId: 1,
            parent_id: 1,
            updatedAt: '',
            userId: 1,
            user_id: 1,
          },
          moved: false,
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
          headers,
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
            },
          },
          headers,
        ]);
      });
    });

    describe('delete folder', () => {
      it('Should call with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'delete').resolves({
          valid: true,
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.deleteFolder(2);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/folder/2', headers]);
        expect(body).toEqual({
          valid: true,
        });
      });
    });

    describe('folder size', () => {
      it('Should call with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'get').resolves({
          size: 10,
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.getFolderSize(2);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/folder/size/2', headers]);
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
          plain_name: 'plain',
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
              plain_name: fileEntry.plain_name,
              encrypt_version: fileEntry.encrypt_version,
            },
          },
          headers,
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
            itemName: 'new name',
          },
        };
        const callStub = sinon.stub(httpClient, 'post').resolves({
          valid: true,
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.updateFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          '/storage/file/6/meta',
          {
            metadata: {
              itemName: 'new name',
            },
            bucketId: 'bucket',
            relativePath: 'x',
          },
          headers,
        ]);
        expect(body).toEqual({
          valid: true,
        });
      });
    });

    describe('delete file', () => {
      it('Should call with right arguments and return control', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'delete').resolves({
          valid: true,
        });
        const { client, headers } = clientAndHeaders();
        const payload: DeleteFilePayload = {
          fileId: 5,
          folderId: 2,
        };

        // Act
        const body = await client.deleteFile(payload);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/folder/2/file/5', headers]);
        expect(body).toEqual({
          valid: true,
        });
      });
    });

    describe('move file', () => {
      it('Should call with right arguments & return content', async () => {
        // Arrange
        const payload = randomMoveFilePayload();
        const callStub = sinon.stub(httpClient, 'post').resolves({
          content: 'test',
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.moveFile(payload);

        // Assert
        expect(body).toEqual({
          content: 'test',
        });
        expect(callStub.firstCall.args).toEqual([
          '/storage/move/file',
          {
            fileId: payload.fileId,
            destination: payload.destination,
            relativePath: payload.destinationPath,
            bucketId: payload.bucketId,
          },
          headers,
        ]);
      });
    });

    describe('get recent files', () => {
      it('Should be called with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'get').resolves({
          files: [],
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.getRecentFiles(5);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/recents?limit=5', headers]);
        expect(body).toEqual({
          files: [],
        });
      });
    });

    describe('replace file', () => {
      it('Should call with right arguments & return content', async () => {
        // Arrange
        const fileId = 'https://api.4shared.com/v1_2/files/replace';
        const size = 100;
        const fileUUID = v4();
        const response = randomFileData();
        const callStub = sinon.stub(httpClient, 'put').resolves(response);
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.replaceFile(fileUUID, {
          fileId,
          size,
        });

        // Assert
        expect(callStub.firstCall.args).toEqual([
          `/files/${fileUUID}`,
          {
            fileId,
            size,
          },
          headers,
        ]);
        expect(body).toEqual(response);
      });
    });
  });

  describe('-> quotas', () => {
    describe('space usage', () => {
      it('should call with right params & return response', async () => {
        // Arrange
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'get').resolves({
          total: 10,
        });

        // Act
        const body = await client.spaceUsage();

        // Assert
        expect(callStub.firstCall.args).toEqual(['/usage', headers]);
        expect(body).toEqual({
          total: 10,
        });
      });
    });

    describe('space limit', () => {
      it('should call with right params & return response', async () => {
        // Arrange
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'get').resolves({
          total: 10,
        });

        // Act
        const body = await client.spaceLimit();

        // Assert
        expect(callStub.firstCall.args).toEqual(['/limit', headers]);
        expect(body).toEqual({
          total: 10,
        });
      });
    });

    describe('Trash', () => {
      describe('get Trash', () => {
        it('Should return the expected elements', async () => {
          // Arrange
          const response = randomFolderContentResponse(2, 2);
          const { client } = clientAndHeaders();
          sinon.stub(httpClient, 'getCancellable').returns({
            promise: Promise.resolve(response),
            requestCanceler: {
              cancel: () => null,
            },
          });

          // Act
          const [promise, requestCanceler] = client.getTrash();
          const body = await promise;

          // Assert
          expect(body.files).toHaveLength(2);
          expect(body.children).toHaveLength(2);
        });

        it('Should cancel the request', async () => {
          // Arrange
          const { client } = clientAndHeaders();

          // Act
          const [promise, requestCanceler] = client.getTrash();
          requestCanceler.cancel('My cancel message');

          // Assert
          await expect(promise).rejects.toThrowError('My cancel message');
        });
      });

      describe('Add Items into trash', () => {
        it('should call with right params & return 200', async () => {
          const { client, headers } = clientAndHeaders();
          const callStub = sinon.stub(httpClient, 'post').resolves(true);
          const itemsToTrash = [
            { id: 'id1', type: 'file' },
            { id: 'id2', type: 'folder' },
          ];

          // Act
          const body = await client.addItemsToTrash({ items: itemsToTrash });

          // Assert
          expect(callStub.firstCall.args).toEqual(['/storage/trash/add', { items: itemsToTrash }, headers]);
          expect(body).toEqual(true);
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
  mnemonic = 'nemo',
): {
  client: Storage;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Storage.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken(clientName, clientVersion, token);
  return { client, headers };
}
