import axios from 'axios';

import { extractAxiosErrorMessage } from '../../utils';
import { Photo, PhotoId, PhotosModel } from '..';

export default class PhotosSubmodule {
  private model: PhotosModel;

  constructor(model: PhotosModel) {
    this.model = model;
  }

  getPhotoById(photoId: PhotoId): Promise<Photo> {
    return axios
      .get<Photo>(`${this.model.baseUrl}/photos/${photoId}`, {
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

  getPhotos(offset: number, limit: number): Promise<Photo[]> {
    if (limit > 200 || limit < 1) {
      throw new Error('Invalid limit. Limit should be positive and lower than 201. Provided limit was: ' + limit);
    }

    if (offset < 0) {
      throw new Error('Invalid offset. Offset should be positive. Provided offset was: ' + offset);
    }

    return axios
      .get<Photo[]>(`${this.model.baseUrl}/photos/?offset=${offset}&limit=${limit}`, {
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

  getPhotosCountByMonth(month: number, year: number): Promise<number> {
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

  getPhotosCountByYear(year: number): Promise<number> {
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

  createPhoto(photo: Omit<Photo, 'id'>): Promise<PhotoId> {
    return axios
      .post<PhotoId>(`${this.model.baseUrl}/photos`, photo, {
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

  deletePhotoById(photoId: PhotoId): Promise<unknown> {
    return axios
      .delete(`${this.model.baseUrl}/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }
}
