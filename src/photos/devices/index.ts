import axios from 'axios';

import { extractAxiosErrorMessage } from '../../utils';
import { Device, DeviceId, PhotosModel } from '..';

export default class DevicesSubmodule {
  private model: PhotosModel;

  constructor(model: PhotosModel) {
    this.model = model;
  }

  getDeviceById(deviceId: DeviceId): Promise<Device> {
    return axios
      .get<Device>(`${this.model.baseUrl}/photos/${deviceId}`, {
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

  createDevice(device: Omit<Device, 'id'>): Promise<DeviceId> {
    return axios
      .post<DeviceId>(`${this.model.baseUrl}/photos`, device, {
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

  deleteDevice(deviceId: DeviceId): Promise<unknown> {
    return axios
      .delete(`${this.model.baseUrl}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }
}
