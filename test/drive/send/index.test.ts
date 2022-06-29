import sinon from 'sinon';
import { Send, Share } from '../../../src/drive';
import { CreateSendLinkPayload } from '../../../src/drive/send/types';
import { ApiSecurity, AppDetails } from '../../../src/shared';
import { basicHeaders } from '../../../src/shared/headers';
import { HttpClient } from '../../../src/shared/http/client';

const httpClient = HttpClient.create('');

describe('Send Links', () => {
  beforeEach(() => {
      sinon.stub(HttpClient, 'create').returns(httpClient);
    });
  
  afterEach(() => {
    sinon.restore();
  });
  const sendLinkMock = {
    id: 'd9c3739c-fd27-45a7-86c5-43d7636ef08e',
    title: 'File Test',
    subject: 'Esto es una prueba de archivo',
    code: 'code',
    views: 0,
    userId: null,
    items: [
        {
            id: '2df1be2e-e648-4bfa-a887-d327ea5e2251',
            name: 'test',
            type: 'jpg',
            linkId: 'd9c3739c-fd27-45a7-86c5-43d7636ef08e',
            networkId: 'test',
            encryptionKey: 'test',
            size: 100000,
            createdAt: '2022-06-29T10:29:07.194Z',
            updatedAt: '2022-06-29T10:29:07.194Z'
        }
    ],
    createdAt: '2022-06-29T10:29:07.193Z',
    updatedAt: '2022-06-29T10:29:07.193Z',
    expirationAt: '2022-07-14T10:29:07.193Z'
  };
  describe('create send link', () => {
    it('should be call with right arguments & return content', async () => {
      
      const callStub = sinon.stub(httpClient, 'post').resolves(sendLinkMock);
      const { client, headers } = getClient();
      const payload: CreateSendLinkPayload = {
        items: [
            {
                name: 'test',
                type: 'jpg',
                networkId: 'test',
                encryptionKey: 'test',
                size: 100000
            }
        ],
        sender: 'test@internxt.com',
        receivers: ['test@internxt.com'],
        code: 'code',
        title: 'File Test',
        subject: 'Esto es una prueba de archivo'
    };
      const body = await client.createSendLink(payload);

      expect(callStub.firstCall.args).toEqual([
        '/links',
        payload,
        headers
      ]);
      expect(body).toEqual(sendLinkMock);
    });
  });

  describe('get send link by linkId', () => {
    it('should be call with right arguments & return content', async () => {

      const callStub = sinon.stub(httpClient, 'get').resolves(sendLinkMock);
      const { client, headers } = getClient();
      const body = await client.getSendLink(sendLinkMock.id);

      expect(callStub.firstCall.args).toEqual([
        `/links/${sendLinkMock.id}`,
        headers
      ]);
      expect(body).toEqual(sendLinkMock);
    });
  });
});

function getClient(apiUrl = '', clientName = 'c-name', clientVersion = '0.1'): { client: Send, headers: object} {
  const appDetails: AppDetails = {
    clientName,
    clientVersion
  };
  const client = Send.client(apiUrl, appDetails);
  const headers = basicHeaders(clientName, clientVersion);
  return { client, headers };
}