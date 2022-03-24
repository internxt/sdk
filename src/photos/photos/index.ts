import axios from 'axios';
import queryString from 'query-string';

import { extractAxiosErrorMessage } from '../../utils';
import { CreatePhotoData, Photo, PhotoId, PhotoJSON, PhotosSdkModel, PhotoStatus } from '..';
import { PhotoWithDownloadLink } from '../types';

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

  public getPhotos(
    filter: { name?: string; status?: PhotoStatus; statusChangedAt?: Date },
    skip: number,
    limit: number,
    includeDownloadLinks: false,
  ): Promise<{ results: Photo[]; count: number }>;
  public getPhotos(
    filter: { name?: string; status?: PhotoStatus; statusChangedAt?: Date },
    skip: number,
    limit: number,
    includeDownloadLinks: true,
  ): Promise<{ results: PhotoWithDownloadLink[]; count: number }>;
  public getPhotos(
    filter: { name?: string; status?: PhotoStatus; statusChangedAt?: Date },
    skip = 0,
    limit = 1,
    includeDownloadLinks: boolean = false,
  ): Promise<{ results: Photo[]; count: number }> {
    const query = queryString.stringify({ ...filter, skip, limit, includeDownloadLinks });

    if (skip < 0) {
      throw new Error('Invalid skip. Skip should be positive. Provided skip was: ' + skip);
    }

    if (limit > 200 || limit < 1) {
      throw new Error('Invalid limit. Limit should be positive and lower than 201. Provided limit was: ' + limit);
    }

    return axios
      .get<{ results: PhotoJSON[]; count: number }>(`${this.model.baseUrl}/photos/?${query}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => ({ results: res.data.results.map((photoJson) => this.parse(photoJson)), count: res.data.count }))
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
      takenAt: new Date(json.takenAt),
      statusChangedAt: new Date(json.statusChangedAt),
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    };
  }
}
