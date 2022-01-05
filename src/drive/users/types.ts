export enum ReferralType {
  Storage = 'storage',
}

export enum ReferralKey {
  CreateAccount = 'create-account',
  InstallMobileApp = 'install-mobile-app',
  ShareFile = 'share-file',
  SubscribeToNewsletter = 'subscribe-to-newsletter',
  InstallDesktopApp = 'install-desktop-app',
  InviteFriends = 'invite-friends',
}

export interface UserReferral {
  key: ReferralKey
  steps: number
  completedSteps: number
  isCompleted: boolean
  credit: number
  type: ReferralType
}

export interface InitializeUserResponse {
  email: string
  bucket: string
  mnemonic: string
  root_folder_id: number
}