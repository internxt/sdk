import sinon from 'sinon';
import { Trash } from '../../../src/drive';
import { randomFolderContentResponse } from '../storage/mothers/folderContentResponse.mother';
import { DeleteFilePayload, DeleteItemsPermanentlyPayload } from '../../../src/drive/trash/types';
import { headersWithTokenAndMnemonic } from '../../../src/shared/headers';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('# trash service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('-> folders', () => {
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
  });

  describe('-> files', () => {
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
  });

  describe('Trash', () => {
    describe('get Trash', () => {
      it('Should return the expected elements', async () => {
        // Arrange
        const response = randomFolderContentResponse(2, 2);
        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'get').resolves(response);

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

    describe('Clear trash', () => {
      it('should return an empty body', async () => {
        // Arrange
        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'delete').resolves();

        // Act
        const body = await client.clearTrash();

        // Assert
        expect(body).toBe(undefined);
      });
    });

    describe('Delete trashed items', () => {
      it('should call with right params', async () => {
        const { client, headers } = clientAndHeaders();
        const callStub = sinon.stub(httpClient, 'delete').resolves();
        const payload: DeleteItemsPermanentlyPayload = {
          items: [
            { id: 36225, type: 'folder' },
            { id: 36225, type: 'folder' },
            { id: '36225', type: 'file' },
          ],
        };

        const body = await client.deleteItemsPermanently(payload);

        expect(callStub.firstCall.args).toEqual(['/storage/trash', headers, payload]);
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
  mnemonic = 'nemo',
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
    mnemonic: mnemonic,
  };
  const client = Trash.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithTokenAndMnemonic(clientName, clientVersion, token, mnemonic);
  return { client, headers };
}
