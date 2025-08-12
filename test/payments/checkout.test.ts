import sinon from 'sinon';
import { HttpClient } from '../../src/shared/http/client';
import { Checkout } from '../../src/payments';
import { ApiSecurity, AppDetails } from '../../src/shared';
import { basicHeaders } from '../../src/shared/headers';
import { CryptoCurrency } from '../../src/payments/types';

const httpClient = HttpClient.create('');

describe('Checkout service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
    jest.resetAllMocks();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Fetch available crypto currencies', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const mockedCryptoCurrency: CryptoCurrency = {
        currencyId: 'some-id',
        imageUrl: 'http://some-url',
        name: 'Bitcoin',
        networks: [
          {
            platformId: 'bitcoin',
            name: 'Bitcoin Network',
          },
        ],
        receiveType: true,
        type: 'crypto',
      };
      const callStub = sinon.stub(httpClient, 'get').resolves([mockedCryptoCurrency]);

      const { client, headers } = clientAndHeadersWithToken({});

      // Act
      const body = await client.getAvailableCryptoCurrencies();

      // Assert
      expect(callStub.firstCall.args).toEqual(['/checkout/crypto/currencies', headers]);
      expect(body).toStrictEqual([mockedCryptoCurrency]);
    });
  });

  describe('Verify crypto payments', () => {
    it('should call with right params & return data', async () => {
      // Arrange
      const mockedInvoiceId = 'encoded-invoice-id';
      const callStub = sinon.stub(httpClient, 'post').resolves(true);

      const { client, headers } = clientAndHeadersWithToken({});

      // Act
      const body = await client.verifyCryptoPayment(mockedInvoiceId);

      // Assert
      expect(callStub.firstCall.args).toEqual(['/checkout/crypto/verify/payment', { token: mockedInvoiceId }, headers]);
      expect(body).toStrictEqual(true);
    });
  });
});

function clientAndHeadersWithToken({
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'token',
  desktopHeader,
}: {
  apiUrl?: string;
  clientName?: string;
  clientVersion?: string;
  token?: string;
  desktopHeader?: string;
}): {
  client: Checkout;
  headers: object;
} {
  const additionalHeaders: Record<string, string> = {};
  const appDetails: AppDetails = {
    clientName: clientName,
    clientVersion: clientVersion,
    desktopHeader: desktopHeader,
  };
  const apiSecurity: ApiSecurity = {
    token: token,
  };

  if (desktopHeader) {
    additionalHeaders['x-internxt-desktop-header'] = desktopHeader;
  }

  const client = Checkout.client(apiUrl, appDetails, apiSecurity);
  const headers = basicHeaders(clientName, clientVersion);
  return { client, headers };
}
