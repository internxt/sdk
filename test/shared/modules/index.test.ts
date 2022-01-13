import { ApiModule } from '../../../src/shared/modules';
import { getDriveAxiosClient } from '../../../src/drive/shared/axios';

describe('General AppModule tests', () => {

  it('should set a default API URL', function () {
    const axios = getDriveAxiosClient('my-url');
    expect(axios.defaults.baseURL).toEqual('my-url/api');
  });

  it('should not override URL on module instantiation', function () {
    // Arrange
    const axiosOne = getDriveAxiosClient('my-url-1');
    const axiosTwo = getDriveAxiosClient('my-url-2');

    // Act
    new ApiModule(axiosOne);
    new ApiModule(axiosTwo);

    // Assert
    expect(axiosOne.defaults.baseURL).toEqual('my-url-1/api');
    expect(axiosTwo.defaults.baseURL).toEqual('my-url-2/api');
  });

});