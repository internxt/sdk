import axios from 'axios';
import { extractAxiosErrorMessage } from '../../utils';

import { CreatePhotoShareBody, PhotosSdkModel } from '..';
import { GetPhotoShareResponse, Share } from '../types';

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
      .post<Share>(`${this.model.baseUrl}/shares`, body, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((response) => response.data)
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }
}
