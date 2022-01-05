import axios from 'axios';

import { extractAxiosErrorMessage } from '../../utils';
import { InitializeUserData, PhotosSdkModel, User, UserJSON } from '..';

export default class UsersSubmodule {
  private model: PhotosSdkModel;

  constructor(model: PhotosSdkModel) {
    this.model = model;
  }

  public initialize(data: InitializeUserData): Promise<User> {
    return axios
      .post<UserJSON>(
        `${this.model.baseUrl}/users`,
        {
          mac: data.mac,
          name: data.name,
        },
        {
          headers: {
            Authorization: `Bearer ${this.model.accessToken}`,
            'internxt-network-pass': data.bridgePassword,
            'internxt-network-user': data.bridgeUser,
          },
        },
      )
      .then((res) => this.parse(res.data))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  private parse(json: UserJSON): User {
    return {
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    };
  }
}
