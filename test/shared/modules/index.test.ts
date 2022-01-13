import { ApiModule } from '../../../src/shared/modules';
import axios from 'axios';

describe('General AppModule tests', () => {

  it('should set a default API URL', function () {
    new ApiModule(axios, 'my-url');
    expect(axios.defaults.baseURL).toEqual('my-url/api');
  });

});