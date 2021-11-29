export type DeviceId = string;
export interface Device {
  id: DeviceId;
  mac: string;
  name: string;
  userUuid: string;
}
