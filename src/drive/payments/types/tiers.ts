interface AntivirusFeatures {
  enabled: boolean;
}

interface BackupsFeatures {
  enabled: boolean;
}

export interface DriveFeatures {
  enabled: boolean;
  maxSpaceBytes: number;
  workspaces: {
    enabled: boolean;
    minimumSeats: number;
    maximumSeats: number;
    maxSpaceBytesPerSeat: number;
  };
}

interface MeetFeatures {
  enabled: boolean;
  paxPerCall: number;
}

interface MailFeatures {
  enabled: boolean;
  addressesPerUser: number;
}

export interface VpnFeatures {
  enabled: boolean;
  featureId: string;
}

export enum Service {
  Drive = 'drive',
  Backups = 'backups',
  Antivirus = 'antivirus',
  Meet = 'meet',
  Mail = 'mail',
  Vpn = 'vpn',
}

export interface Tier {
  id: string;
  label: string;
  productId: string;
  billingType: 'subscription' | 'lifetime';
  featuresPerService: {
    [Service.Drive]: DriveFeatures;
    [Service.Backups]: BackupsFeatures;
    [Service.Antivirus]: AntivirusFeatures;
    [Service.Meet]: MeetFeatures;
    [Service.Mail]: MailFeatures;
    [Service.Vpn]: VpnFeatures;
  };
}
