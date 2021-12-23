import { PhotosModel } from './types';
import DevicesSubmodule from './devices';
import PhotosSubmodule from './photos';
import SharesSubmodule from './shares';

export class Photos {
  private readonly model: PhotosModel;

  public readonly photos: PhotosSubmodule;
  public readonly devices: DevicesSubmodule;
  public readonly shares: SharesSubmodule;

  constructor(baseUrl: string, accessToken?: string) {
    this.model = { baseUrl, accessToken };

    this.photos = new PhotosSubmodule(this.model);
    this.devices = new DevicesSubmodule(this.model);
    this.shares = new SharesSubmodule(this.model);
  }

  public setBaseUrl(baseUrl: string): void {
    this.model.baseUrl = baseUrl;
  }

  public setAccessToken(accessToken: string): void {
    this.model.accessToken = accessToken;
  }

  get baseUrl(): string | undefined {
    return this.model.baseUrl;
  }

  get accessToken(): string | undefined {
    return this.model.accessToken;
  }
}

export * from './types';
