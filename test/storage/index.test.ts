import sinon from 'sinon';
import { Storage } from '../../src/drive/storage';
import axios from 'axios';
import { randomFolderContentResponse } from './folderContentResponse.mother';
import { validResponse } from '../shared/response';
import { FileEntry } from "../../src/drive/storage/types";

describe('# storage service tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('-> get folder content use case', () => {

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

  describe('-> create file entry use case', () => {

    it('Should have all the correct params on call', async () => {
      // Arrange
      const callStub = sinon.stub(axios, 'post').resolves(validResponse({}));
      const storageClient = new Storage(axios, '', 'c-name', '0.1', 'my-token');
      const fileEntry: FileEntry = {
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