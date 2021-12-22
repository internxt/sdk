import axios from 'axios';
import { extractAxiosErrorMessage } from '../../utils';

import { CreatePhotoShareBody, PhotosModel, Share } from '..';

export default class SharesSubmodule {
  private model: PhotosModel;

  constructor(model: PhotosModel) {
    this.model = model;
  }

  public getShareByToken(token: string) {
    return axios
      .get<Share>(`${this.model.baseUrl}/shares/${token}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
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
      .then(() => undefined)
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  // TODO: create visit share endpoint and method
}
