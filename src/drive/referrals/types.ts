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
  Invite2Friends = 'invite-2-friends',
  CompleteSurvey = 'complete-survey',
}

export interface UserReferral {
  key: ReferralKey;
  steps: number;
  completedSteps: number;
  isCompleted: boolean;
  credit: number;
  type: ReferralType;
}
