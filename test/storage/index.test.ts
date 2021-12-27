import sinon from 'sinon';
import { Storage } from '../../src/drive/storage';
import axios from 'axios';
import { randomFolderContentResponse } from './folderContentResponse.mother';
import { validResponse } from '../shared/response';

describe('# storage service tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('-> get folder content use case', () => {

    it('Should have all the correct params on call', async () => {
      // Arrange
      const response = randomFolderContentResponse(2, 2);
      sinon.stub(axios, 'get').resolves(validResponse(response));
      const storageClient = new Storage(axios, '', '', '');

      // Act
      const [promise, cancelToken] = storageClient.getFolderContent(1);
      const body = await promise;

      // Assert
      expect(body.files).toHaveLength(2);
      expect(body.folders).toHaveLength(2);
    });


    it('Should cancel the request', async () => {
      // Arrange
      const storageClient = new Storage(axios, '', '', '');

      // Act
      const [promise, cancelToken] = storageClient.getFolderContent(1);
      cancelToken.cancel('My cancel message');

      // Assert
      await expect(promise).rejects.toThrowError('My cancel message');
    });

  });

});