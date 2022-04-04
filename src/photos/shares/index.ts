import axios from 'axios';
import { extractAxiosErrorMessage } from '../../utils';

import { CreatePhotoShareBody, PhotosSdkModel } from '..';
import { GetPhotoShareResponse } from '../types';

export default class SharesSubmodule {
  private model: PhotosSdkModel;

  constructor(model: PhotosSdkModel) {
    this.model = model;
  }

  public getShare(id: string, code: string) {
    return axios
      .get<GetPhotoShareResponse>(`${this.model.baseUrl}/shares/${id}?code=${code}`)
      .then((response) => response.data)
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public createShare(body: CreatePhotoShareBody) {
    return axios
      .post<CreatePhotoShareBody, void>(`${this.model.baseUrl}/shares`, body, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }
}
