interface WorkspaceUser {
  id: string;
  memberId: string;
  key: string;
  workspaceId: string;
  spaceLimit: string;
  driveUsage: string;
  backupsUsage: string;
  deactivated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  address: string;
  name: string;
  description: string;
  defaultTeamId: string;
  workspaceUserId: string;
  setupCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceData {
  workspaceUser: WorkspaceUser;
  workspace: Workspace;
}

export type WorkspaceSetupInfo = {
  workspaceId: string;
  name: string;
  address: string;
  description: string;
  encryptedMnemonic: string;
};

export type PendingWorkspace = {
  address: string | null;
  createdAt: string;
  defaultTeamId: string;
  description: string | null;
  id: string;
  name: string;
  ownerId: string;
  setupCompleted: boolean;
  updatedAt: string;
  workspaceUserId: string;
};

export type WorkspacesResponse = {
  availableWorkspaces: WorkspaceData[];
  pendingWorkspaces: PendingWorkspace[];
};

export interface CreateTeamData {
  workspaceId: string;
  name: string;
  managerId: string;
}

export type Team = {
  id: string;
  name: string;
  managerId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMembers = {
  activatedUsers: WorkspaceUser[];
  disabledUsers: WorkspaceUser[];
};

export type Member = {
  id: number;
  userId: string;
  name: string;
  lastname: string;
  email: string;
  username: string;
  bridgeUser: string;
  rootFolderId: number;
  errorLoginCount: number;
  isEmailActivitySended: boolean;
  referralCode: string;
  referrer: string | null;
  syncDate: string | null;
  uuid: string;
  lastResend: string | null;
  credit: number;
  welcomePack: boolean;
  registerCompleted: boolean;
  backupsBucket: string | null;
  sharedWorkspace: boolean;
  avatar: string | null;
  lastPasswordChangedAt: string | null;
};

export type ActivatedUser = {
  isOwner: boolean;
  isManager: boolean;
  usedSpace: string;
  freeSpace: string;
  id: string;
  memberId: string;
  key: string;
  workspaceId: string;
  spaceLimit: string;
  driveUsage: string;
  backupsUsage: string;
  deactivated: boolean;
  member: Member;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceTeam = {
  membersCount: number;
  team: Team;
};

export type WorkspaceTeamResponse = WorkspaceTeam[];

export type InviteMemberBody = {
  workspaceId: string;
  invitedUserEmail: string;
  spaceLimitBytes: number;
  encryptedMnemonicInBase64: string;
  encryptionAlgorithm: string;
};
