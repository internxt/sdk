import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Trash } from '../../../src/drive';
import { randomFolderContentResponse } from '../storage/mothers/folderContentResponse.mother';
import { DeleteFilePayload, DeleteItemsPermanentlyPayload } from '../../../src/drive/trash/types';
import { headersWithToken } from '../../../src/shared/headers';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { HttpClient } from '../../../src/shared/http/client';

describe('# trash service tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('-> folders', () => {
    describe('delete folder', () => {
      it('Should call with right arguments & return content', async () => {
        // Arrange
        const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({
          valid: true,
        });
        const { client, headers } = clientAndHeaders();

        // Act
        const body = await client.deleteFolder(2);

        // Assert
        expect(callStub).toHaveBeenCalledWith('/storage/folder/2', headers);
        expect(body).toEqual({
          valid: true,
        });
      });
    });
  });

  describe('-> files', () => {
    describe('delete file', () => {
      it('Should call with right arguments and return control', async () => {
        // Arrange
        const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue({
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
        expect(callStub).toHaveBeenCalledWith('/storage/folder/2/file/5', headers);
        expect(body).toEqual({
          valid: true,
        });
      });
    });
  });

  describe('Trash', () => {
    describe('get Trash', () => {
      it('Should return the expected elements', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client } = clientAndHeaders();
        vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue(response);

        // Act
        const body = await client.getTrash();
        // Assert
        expect(body.files).toHaveLength(2);
        expect(body.children).toHaveLength(2);
      });
    });

    describe('Add Items into trash', () => {
      it('should call with right params & return 200', async () => {
        const { client, headers } = clientAndHeaders();
        const callStub = vi.spyOn(HttpClient.prototype, 'post').mockResolvedValue(true);
        const itemsToTrash = [
          { id: 'id1', uuid: 'uuid1', type: 'file' as const },
          { id: 'id2', uuid: 'uuid2', type: 'folder' as const },
        ];

        // Act
        const body = await client.addItemsToTrash({ items: itemsToTrash });

        // Assert
        expect(callStub).toHaveBeenCalledWith('/storage/trash/add', { items: itemsToTrash }, headers);
        expect(body).toEqual(true);
      });
    });

    describe('Clear trash', () => {
      it('should return an empty body', async () => {
        // Arrange
        const { client } = clientAndHeaders();
        vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue(undefined);

        // Act
        const body = await client.clearTrash();

        // Assert
        expect(body).toBe(undefined);
      });
    });

    describe('Delete trashed items', () => {
      it('should call with right params', async () => {
        const { client, headers } = clientAndHeaders();
        const callStub = vi.spyOn(HttpClient.prototype, 'delete').mockResolvedValue(undefined);
        const payload: DeleteItemsPermanentlyPayload = {
          items: [
            { id: 36225, type: 'folder' },
            { id: 36225, type: 'folder' },
            { id: '36225', type: 'file' },
          ],
        };

        const body = await client.deleteItemsPermanently(payload);

        expect(callStub).toHaveBeenCalledWith('/storage/trash', headers, payload);
        expect(body).toBe(undefined);
      });
    });
  });
});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
): {
  client: Trash;
  headers: object;
} {
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };
  const client = Trash.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken({ clientName, clientVersion, token });
  return { client, headers };
}
