export interface AntivirusFeatures {
  enabled: boolean;
}

export interface BackupsFeatures {
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
  passwordProtectedSharing: {
    enabled: boolean;
  };
  restrictedItemsSharing: {
    enabled: boolean;
  };
}

export interface MeetFeatures {
  enabled: boolean;
  paxPerCall: number;
}

export interface MailFeatures {
  enabled: boolean;
  addressesPerUser: number;
}

export interface VpnFeatures {
  enabled: boolean;
  featureId: string;
}

export interface CleanerFeatures {
  enabled: boolean;
}

export interface DarkMonitorFeatures {
  enabled: boolean;
}

export enum Service {
  Drive = 'drive',
  Backups = 'backups',
  Antivirus = 'antivirus',
  Meet = 'meet',
  Mail = 'mail',
  Vpn = 'vpn',
  Cleaner = 'cleaner',
  darkMonitor = 'darkMonitor',
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
    [Service.Cleaner]: CleanerFeatures;
    [Service.darkMonitor]: DarkMonitorFeatures;
  };
}
