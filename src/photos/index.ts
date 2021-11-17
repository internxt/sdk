import axios from 'axios';

import { extractAxiosErrorMessage } from '../utils';
import { Device, DeviceId } from './models/Device';
import { Photo, PhotoId } from './models/Photo';

export class Photos {
  private url: string;
  private token?: string;

  constructor(url: string) {
    this.url = url;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getPhotoById(photoId: PhotoId, token?: string): Promise<Photo> {
    return axios
      .get<Photo>(`${this.url}/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  getPhotos(offset: number, limit: number, token?: string): Promise<Photo[]> {
    if (limit > 200 || limit < 1) {
      throw new Error('Invalid limit. Limit should be positive and lower than 201. Provided limit was: ' + limit);
    }

    if (offset < 0) {
      throw new Error('Invalid offset. Offset should be positive. Provided offset was: ' + offset);
    }

    return axios
      .get<Photo[]>(`${this.url}/photos/?offset=${offset}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  getPhotosCountByMonth(month: number, year: number, token?: string): Promise<number> {
    return axios
      .get<number>(`${this.url}/photos/?month=${month}&year=${year}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  getPhotosCountByYear(year: number, token?: string): Promise<number> {
    return axios
      .get<number>(`${this.url}/photos/?year=${year}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  createPhoto(photo: Photo, token?: string): Promise<PhotoId> {
    return axios
      .post<PhotoId>(`${this.url}/photos`, photo, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  deletePhotoById(photoId: PhotoId, token?: string): Promise<unknown> {
    return axios
      .delete(`${this.url}/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  getDeviceById(deviceId: DeviceId, token?: string): Promise<Device> {
    return axios
      .get<Device>(`${this.url}/photos/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  createDevice(device: Device, token?: string): Promise<DeviceId> {
    return axios
      .post<DeviceId>(`${this.url}/photos`, device, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  deleteDevice(deviceId: DeviceId, token?: string): Promise<unknown> {
    return axios
      .delete(`${this.url}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${token ?? this.token}`,
        },
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }
}
