export interface PhotosModel {
  baseUrl: string;
  accessToken?: string;
}

export type DeviceId = string;
export interface Device {
  id: DeviceId;
  mac: string;
  name: string;
  userUuid: string;
  createdAt: string;
  updatedAt: string;
}

export type PhotoType = string;
export type FileId = string;
export type PhotoId = string;
export interface Photo {
  id: PhotoId;
  name: string;
  type: PhotoType;
  size: number;
  width: number;
  heigth: number;
  fileId: FileId;
  previewId: FileId;
  deviceId: DeviceId;
  userUuid: string;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  bucket: string;
  encryptionKey: string;
  photoId: string;
  token: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhotoShareBody {
  encryptionKey: string;
  views: number;
  photoId: string;
  bucket: string;
}
