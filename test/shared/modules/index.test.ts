import { AppModule } from '../../../src/shared/modules';
import axios from 'axios';

describe('General AppModule tests', () => {

  it('should set a default API URL', function () {
    new AppModule(axios, 'my-url');
    expect(axios.defaults.baseURL).toEqual('my-url/api');
  });

});