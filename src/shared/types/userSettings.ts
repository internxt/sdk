import {AppSumoDetails} from './appsumo';

export interface UserSettings {
    bucket: string;
    backupsBucket: string | null;
    createdAt: Date;
    credit: number;
    email: string;
    lastname: string;
    mnemonic: string;
    name: string;
    privateKey: string;
    publicKey: string;
    registerCompleted: boolean;
    revocationKey: string;
    root_folder_id: number;
    userId: string;
    uuid: string;
    teams?: boolean;
    username: string;
    bridgeUser: string;
    sharedWorkspace: boolean;
    appSumoDetails: AppSumoDetails | null;
    hasReferralsProgram: boolean;
}
