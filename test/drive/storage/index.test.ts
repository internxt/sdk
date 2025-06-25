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
  FileMeta,
  FolderAncestorWorkspace,
  MoveFolderPayload,
  MoveFolderResponse,
  UpdateFilePayload,
} from '../../../src/drive/storage/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { CustomHeaders, headersWithToken } from '../../../src/shared/headers';
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
        const { client } = clientAndHeaders({});
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
            {
              ...subFolder1,
              type: 'folder',
              color: '',
              encrypt_version: subFolder1.encryptVersion,
              icon: '',
              plain_name: subFolder1.plainName || '',
              parentId: subFolder1.parentId || 0,
              parent_id: subFolder1.parentId || 0,
              user_id: subFolder1.userId,
            },
            {
              ...subFolder2,
              type: 'folder',
              color: '',
              encrypt_version: subFolder2.encryptVersion,
              icon: '',
              plain_name: subFolder2.plainName || '',
              parentId: subFolder2.parentId || 0,
              parent_id: subFolder2.parentId || 0,
              user_id: subFolder2.userId,
            },
          ],
        };
        const { client, headers } = clientAndHeaders({});
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
            {
              ...subFolder1,
              type: 'file',
              color: '',
              encrypt_version: subFolder1.encryptVersion,
              icon: '',
              plain_name: subFolder1.plainName || '',
              parentId: subFolder1.parentId || 0,
              parent_id: subFolder1.parentId || 0,
              user_id: subFolder1.userId,
            },
            {
              ...subFolder2,
              type: 'file',
              color: '',
              encrypt_version: subFolder2.encryptVersion,
              icon: '',
              plain_name: subFolder2.plainName || '',
              parentId: subFolder2.parentId || 0,
              parent_id: subFolder2.parentId || 0,
              user_id: subFolder2.userId,
            },
          ],
        };
        const { client, headers } = clientAndHeaders({});
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
        const { client, headers } = clientAndHeaders({});
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
        const { client, headers } = clientAndHeaders({});

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
        const { client } = clientAndHeaders({});

        // Act
        const [promise, requestCanceler] = client.getFolderContent(1);
        requestCanceler.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrow('My cancel message');
      });

      it('Should return the expected elements with trash', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client, headers } = clientAndHeaders({});
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
          createdAt: new Date(),
          id: 2,
          name: 'zero',
          plainName: 'ma-fol',
          parentUuid: v4(),
          parentId: 0,
          updatedAt: new Date(),
          userId: 1,
          uuid: '1234-5678-1234-5678',
          creationTime: new Date(),
          modificationTime: new Date(),
          deleted: false,
          deletedAt: null,
          encryptVersion: '03-aes',
          removed: false,
          removedAt: null,
        };
        const callStub = sinon.stub(httpClient, 'postCancellable').returns({
          promise: Promise.resolve(createFolderResponse),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const { client, headers } = clientAndHeaders({});

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
        const { client } = clientAndHeaders({});

        // Act
        const [promise, requestCanceler] = client.createFolder(createFolderPayload);
        requestCanceler.cancel('My cancel message');

        // Assert
        await expect(promise).rejects.toThrow('My cancel message');
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
        const { client, headers } = clientAndHeaders({});

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
        const { client, headers } = clientAndHeaders({});
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
        const { client, headers } = clientAndHeaders({});

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
        const { client, headers } = clientAndHeaders({});

        // Act
        const body = await client.getFolderSize(2);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/folder/size/2', headers]);
        expect(body).toEqual(10);
      });
    });

    describe('getFolderAncestorsInWorkspace', () => {
      it('When resourceToken is provided then should call with right arguments & return content', async () => {
        // Arrange
        const workspaceId = v4();
        const itemType = 'folder';
        const itemUuid = v4();
        const resourceToken = 'resource-token-workspace';
        const mockResponse: FolderAncestorWorkspace[] = [
          {
            uuid: v4(),
            plainName: 'mi-folder1',
          },
          {
            uuid: v4(),
            plainName: 'mi-folder2',
          },
          {
            uuid: v4(),
            plainName: 'mi-folder3',
          },
        ];
        const callStub = sinon.stub(httpClient, 'get').resolves(mockResponse);
        const { client, headers } = clientAndHeaders({
          customHeaders: {
            'internxt-resources-token': resourceToken,
          },
        });

        // Act
        const body = await client.getFolderAncestorsInWorkspace(workspaceId, itemType, itemUuid, resourceToken);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          `workspaces/${workspaceId}/${itemType}/${itemUuid}/ancestors`,
          headers,
        ]);
        expect(body).toEqual(mockResponse);
      });

      it('When resourceToken is NOT provided then it should call the client.get method without the resourcesToken in headers', async () => {
        // Arrange
        const workspaceId = v4();
        const itemType = 'folder';
        const itemUuid = v4();
        const mockResponse: FolderAncestorWorkspace[] = [
          {
            uuid: v4(),
            plainName: 'mi-folder1',
          },
          {
            uuid: v4(),
            plainName: 'mi-folder2',
          },
          {
            uuid: v4(),
            plainName: 'mi-folder3',
          },
        ];
        const callStub = sinon.stub(httpClient, 'get').resolves(mockResponse);
        const { client, headers } = clientAndHeaders({});

        // Act
        const body = await client.getFolderAncestorsInWorkspace(workspaceId, itemType, itemUuid);

        // Assert
        expect(callStub.firstCall.args).toEqual([
          `workspaces/${workspaceId}/${itemType}/${itemUuid}/ancestors`,
          headers,
        ]);
        expect(body).toEqual(mockResponse);
      });
    });
  });

  describe('-> files', () => {
    describe('create file entry', () => {
      it('Should have all the correct params on call', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'post').resolves({});
        const { client, headers } = clientAndHeaders({});
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
        const { client, headers } = clientAndHeaders({});

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
        const { client, headers } = clientAndHeaders({});
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
        const { client, headers } = clientAndHeaders({});

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
        const { client, headers } = clientAndHeaders({});

        // Act
        const body = await client.getRecentFiles(5);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/storage/recents?limit=5', headers]);
        expect(body).toEqual({
          files: [],
        });
      });
    });

    describe('get recent files V2', () => {
      it('Should be called with right arguments & return content', async () => {
        // Arrange
        const callStub = sinon.stub(httpClient, 'get').resolves({
          files: [],
        });
        const { client, headers } = clientAndHeaders({});

        // Act
        const body = await client.getRecentFilesV2(5);

        // Assert
        expect(callStub.firstCall.args).toEqual(['/files/recents?limit=5', headers]);
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
        const { client, headers } = clientAndHeaders({});

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

    describe('getFile', () => {
      it('When a fileId is provided without a workspaceToken then it should call getCancellable with the correct URL and headers', async () => {
        // Arrange
        const fileUUID = v4();
        const response = randomFileData() as FileMeta;
        const callStub = sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const workspaceToken = undefined;
        const { client, headers } = clientAndHeaders({});

        // Act
        const [promise, _] = client.getFile(fileUUID, workspaceToken);
        const body = await promise;

        // Assert
        expect(callStub.firstCall.args).toEqual([`/files/${fileUUID}/meta`, headers]);
        expect(body).toEqual(response);
      });

      it('When a fileId is provided with a workspaceToken then it should call getCancellable with the correct URL and custom headers', async () => {
        // Arrange
        const fileUUID = v4();
        const response = randomFileData() as FileMeta;
        const callStub = sinon.stub(httpClient, 'getCancellable').returns({
          promise: Promise.resolve(response),
          requestCanceler: {
            cancel: () => null,
          },
        });
        const workspaceToken = 'workspace-token';
        const { client, headers } = clientAndHeaders({ workspaceToken });

        // Act
        const [promise, _] = client.getFile(fileUUID, workspaceToken);
        const body = await promise;

        // Assert
        expect(callStub.firstCall.args).toEqual([`/files/${fileUUID}/meta`, headers]);
        expect(body).toEqual(response);
      });
    });
  });

  describe('-> quotas', () => {
    describe('space usage', () => {
      it('should call with right params & return response', async () => {
        // Arrange
        const { client, headers } = clientAndHeaders({});
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

    describe('space usage v2', () => {
      it('should call with right params & return response', async () => {
        const { client, headers } = clientAndHeaders({});
        const callStub = sinon.stub(httpClient, 'get').resolves({
          drive: 10,
        });

        const body = await client.spaceUsageV2();

        expect(callStub.firstCall.args).toEqual(['/users/usage', headers]);
        expect(body).toEqual({
          drive: 10,
        });
      });
    });

    describe('space limit', () => {
      it('should call with right params & return response', async () => {
        // Arrange
        const { client, headers } = clientAndHeaders({});
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

    describe('space limit v2', () => {
      it('should call with right params & return response', async () => {
        const { client, headers } = clientAndHeaders({});
        const callStub = sinon.stub(httpClient, 'get').resolves({
          maxSpaceBytes: 10,
        });

        const body = await client.spaceLimitV2();

        expect(callStub.firstCall.args).toEqual(['/users/limit', headers]);
        expect(body).toEqual({
          maxSpaceBytes: 10,
        });
      });
    });

    describe('Trash', () => {
      describe('get Trash', () => {
        it('Should return the expected elements', async () => {
          // Arrange
          const response = randomFolderContentResponse(2, 2);
          const { client } = clientAndHeaders({});
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
          const { client } = clientAndHeaders({});

          // Act
          const [promise, requestCanceler] = client.getTrash();
          requestCanceler.cancel('My cancel message');

          // Assert
          await expect(promise).rejects.toThrow('My cancel message');
        });
      });

      describe('Add Items into trash', () => {
        it('should call with right params & return 200', async () => {
          const { client, headers } = clientAndHeaders({});
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

  describe('-> thumbnails', () => {
    describe('createThumbnailEntryWithUUID', () => {
      it('Should create a thumbnail entry with UUID and handle resourcesToken', async () => {
        const thumbnailEntryPayload: StorageTypes.CreateThumbnailEntryPayload = {
          fileUuid: v4(),
          type: 'image/jpeg',
          size: 1024,
          maxWidth: 200,
          maxHeight: 200,
          bucketId: 'bucket123',
          bucketFile: 'file123',
          encryptVersion: StorageTypes.EncryptionVersion.Aes03,
        };

        const resourcesToken = 'resources-token-123';

        const expectedResponse: StorageTypes.Thumbnail = {
          id: 456,
          file_id: 123,
          max_width: 200,
          max_height: 200,
          type: 'image/jpeg',
          size: 1024,
          bucket_id: 'bucket123',
          bucket_file: 'file123',
          encrypt_version: StorageTypes.EncryptionVersion.Aes03,
        };

        const { client, headers } = clientAndHeaders({});
        const headersWithResourceToken = {
          ...headers,
          'internxt-resources-token': resourcesToken,
        };

        const postStub = sinon.stub(httpClient, 'post').resolves(expectedResponse);

        const response = await client.createThumbnailEntryWithUUID(thumbnailEntryPayload, resourcesToken);

        expect(postStub.calledOnce).toBeTruthy();
        expect(postStub.firstCall.args[0]).toEqual('/files/thumbnail');
        expect(postStub.firstCall.args[1]).toEqual({
          ...thumbnailEntryPayload,
        });
        expect(postStub.firstCall.args[2]).toEqual(headersWithResourceToken);
        expect(response).toEqual(expectedResponse);
      });
    });
  });
});

function clientAndHeaders({
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
  mnemonic = 'nemo',
  workspaceToken = undefined,
  customHeaders = undefined,
}: {
  apiUrl?: string;
  clientName?: string;
  clientVersion?: string;
  token?: string;
  mnemonic?: string;
  workspaceToken?: string;
  customHeaders?: CustomHeaders;
}): {
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
  const headers = headersWithToken(clientName, clientVersion, token, workspaceToken, customHeaders);
  return { client, headers };
}
