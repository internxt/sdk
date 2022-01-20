import axios from 'axios';

import { extractAxiosErrorMessage } from '../../utils';
import { CreateDeviceData, Device, DeviceId, DeviceJSON, PhotosSdkModel } from '..';

export default class DevicesSubmodule {
  private model: PhotosSdkModel;

  constructor(model: PhotosSdkModel) {
    this.model = model;
  }

  public getDeviceById(deviceId: DeviceId): Promise<Device> {
    return axios
      .get<DeviceJSON>(`${this.model.baseUrl}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => this.parse(res.data))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public getDevices(): Promise<Device[]> {
    return axios
      .get<{ results: DeviceJSON[]; count: number }>(`${this.model.baseUrl}/devices`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => res.data.results.map((json) => this.parse(json)))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public createDevice(data: CreateDeviceData): Promise<Device> {
    return axios
      .post<DeviceJSON>(`${this.model.baseUrl}/devices`, data, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then((res) => this.parse(res.data))
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  public deleteDevice(deviceId: DeviceId): Promise<void> {
    return axios
      .delete(`${this.model.baseUrl}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${this.model.accessToken}`,
        },
      })
      .then(() => undefined)
      .catch((err) => {
        throw new Error(extractAxiosErrorMessage(err));
      });
  }

  private parse(json: DeviceJSON): Device {
    return {
      ...json,
      newestDate: new Date(json.newestDate),
      oldestDate: json.oldestDate === null ? json.oldestDate : new Date(json.oldestDate),
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    };
  }
}
