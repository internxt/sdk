export interface PhotosSdkModel {
  baseUrl: string;
  accessToken?: string;
}

export type UserId = string;
export interface User {
  id: UserId;
  uuid: string;
  bucketId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface UserJSON extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}
export interface InitializeUserData {
  mac: string;
  name: string;
  bridgeUser: string;
  bridgePassword: string;
}

export type DeviceId = string;
export interface Device {
  id: DeviceId;
  mac: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface DeviceJSON extends Omit<Device, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}
export interface CreateDeviceData {
  mac: string;
  name: string;
  userId: string;
}

export enum PhotoStatus {
  Exists = 'EXISTS',
  Trashed = 'TRASHED',
  Deleted = 'DELETED',
}
export type FileId = string;
export type PhotoId = string;
export interface Photo {
  id: PhotoId;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  fileId: FileId;
  previewId: FileId;
  deviceId: DeviceId;
  userId: string;
  status: PhotoStatus;
  statusChangedAt: Date;
  takenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface PhotoJSON extends Omit<Photo, 'statusChangedAt' | 'takenAt' | 'createdAt' | 'updatedAt'> {
  statusChangedAt: string;
  takenAt: string;
  createdAt: string;
  updatedAt: string;
}
export type CreatePhotoData = Omit<Photo, 'id' | 'status' | 'statusChangedAt' | 'createdAt' | 'updatedAt'>;

export type ShareId = string;
export interface Share {
  id: ShareId;
  bucket: string;
  encryptionKey: string;
  photoId: string;
  token: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface ShareJSON extends Omit<Share, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}
export interface CreatePhotoShareBody {
  encryptionKey: string;
  views: number;
  photoId: string;
  bucket: string;
}
