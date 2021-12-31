import axios from 'axios';

import { extractAxiosErrorMessage } from '../../utils';
import { CreatePhotoData, Photo, PhotoId, PhotoJSON, PhotosSdkModel } from '..';

export default class PhotosSubmodule {
  private model: PhotosSdkModel;

  constructor(model: PhotosSdkModel) {
    this.model = model;
  }

  public getPhotoById(photoId: PhotoId): Promise<Photo> {
    return axios
      .get<PhotoJSON>(`${this.model.baseUrl}/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => this.parse(res.data))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public getPhotos(offset: number, limit: number): Promise<Photo[]> {
    if (limit > 200 || limit < 1) {
      throw new Error('Invalid limit. Limit should be positive and lower than 201. Provided limit was: ' + limit);
    }

    if (offset < 0) {
      throw new Error('Invalid offset. Offset should be positive. Provided offset was: ' + offset);
    }

    return axios
      .get<PhotoJSON[]>(`${this.model.baseUrl}/photos/?offset=${offset}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => res.data.map((photoJson) => this.parse(photoJson)))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public async getPhotosSince(date: Date, limit: number, skip: number): Promise<Photo[]> {
    return axios
      .get<PhotoJSON[]>(`${this.model.baseUrl}/photos?from=${date}&limit=${limit}&skip=${skip}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => res.data.map((photoJson) => this.parse(photoJson)))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public getPhotosCountByMonth(month: number, year: number): Promise<number> {
    return axios
      .get<number>(`${this.model.baseUrl}/photos/?month=${month}&year=${year}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public getPhotosCountByYear(year: number): Promise<number> {
    return axios
      .get<number>(`${this.model.baseUrl}/photos/?year=${year}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public createPhoto(data: CreatePhotoData): Promise<Photo> {
    return axios
      .post<PhotoJSON>(`${this.model.baseUrl}/photos`, data, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => this.parse(res.data))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public deletePhotoById(photoId: PhotoId): Promise<void> {
    return axios
      .delete(`${this.model.baseUrl}/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then(() => undefined)
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  private parse(json: PhotoJSON): Photo {
    return {
      ...json,
      creationDate: new Date(json.creationDate),
      lastStatusChangeAt: new Date(json.lastStatusChangeAt),
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    };
  }
}
