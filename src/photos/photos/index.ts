import axios from 'axios';
import queryString from 'query-string';

import { extractAxiosErrorMessage } from '../../utils';
import { CreatePhotoData, Photo, PhotoId, PhotoJSON, PhotosSdkModel, PhotoStatus } from '..';
import {
  PhotoWithDownloadLink,
  PhotoExistsPayload,
  PhotoExistsData,
  PhotoExistsDataJSON,
  PhotosUsage,
  UpdatePhotoPayload,
  PhotosCount,
} from '../types';

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

  public getPhotosSorted(filter: { status?: PhotoStatus; updatedAt: Date }, skip: number, limit: number) {
    const query = queryString.stringify({ ...filter, skip, limit });

    if (skip < 0) {
      throw new Error('Invalid skip. Skip should be positive. Provided skip was: ' + skip);
    }

    return axios
      .get<{ results: PhotoJSON[] }>(`${this.model.baseUrl}/photos/sorted?${query}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => ({
        results: res.data.results.map((photoJson) => this.parse(photoJson)),
      }))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public getPhotos(
    filter: { name?: string; status?: PhotoStatus; updatedAt?: Date },
    skip: number,
    limit: number,
  ): Promise<{ results: Photo[]; bucketId: string }>;
  public getPhotos(
    filter: { name?: string; status?: PhotoStatus; updatedAt?: Date },
    skip: number,
    limit: number,
    includeDownloadLinks: true,
  ): Promise<{ results: PhotoWithDownloadLink[]; bucketId: string }>;
  public getPhotos(
    filter: { name?: string; status?: PhotoStatus; updatedAt?: Date },
    skip = 0,
    limit = 1,
    includeDownloadLinks?: boolean,
  ): Promise<{ results: Photo[]; bucketId?: string }> {
    const query = queryString.stringify({ ...filter, skip, limit, includeDownloadLinks });

    if (skip < 0) {
      throw new Error('Invalid skip. Skip should be positive. Provided skip was: ' + skip);
    }

    return axios
      .get<{ results: PhotoJSON[]; bucketId?: string }>(`${this.model.baseUrl}/photos/?${query}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => ({
        results: res.data.results.map((photoJson) => this.parse(photoJson)),
        bucketId: res.data.bucketId,
      }))
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

  public findOrCreatePhoto(data: CreatePhotoData): Promise<Photo> {
    return axios
      .post<PhotoJSON>(`${this.model.baseUrl}/photos/photo/exists`, data, {
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

  public getUsage(): Promise<PhotosUsage> {
    return axios
      .get(`${this.model.baseUrl}/photos/usage`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((result) => {
        return result.data as PhotosUsage;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public photosExists(photosExistPayload: PhotoExistsPayload[]): Promise<PhotoExistsData[]> {
    return axios
      .post<{ photos: PhotoExistsDataJSON[] }>(
        `${this.model.baseUrl}/photos/exists`,
        { photos: photosExistPayload },
        {
          headers: {
            Authorization: `Bearer ${this.model.accessToken}`,
          },
        },
      )
      .then((res) => {
        return res.data.photos.map((result) => {
          if ('id' in result) {
            return {
              ...this.parse(result),
              exists: true,
            };
          } else {
            return {
              ...result,
              takenAt: new Date(result.takenAt),
            };
          }
        });
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public updatePhoto(photoId: PhotoId, data: UpdatePhotoPayload): Promise<{ message: string }> {
    return axios
      .patch(`${this.model.baseUrl}/photos/${photoId}`, data, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((result) => {
        return result.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public getCount(): Promise<PhotosCount> {
    return axios
      .get<PhotosCount>(`${this.model.baseUrl}/photos/count`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((result) => result.data)
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
