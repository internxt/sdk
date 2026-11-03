import { components } from '../../schema';

export type PhotoDevice = {
  uuid: string;
  plainName: string;
  bucket: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};

export type GetPhotoFilesInFoldersPayload = components['schemas']['GetFilesInFoldersDto'];

export type GetPhotoFilesInFoldersResponse = components['schemas']['GetFilesInFoldersResponseDto'];

export type PhotoFolderFile = GetPhotoFilesInFoldersResponse['files'][number];
