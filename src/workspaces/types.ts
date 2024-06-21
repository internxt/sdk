export interface WorkspaceUser {
  backupsUsage: string;
  createdAt: string;
  deactivated: boolean;
  driveUsage: string;
  freeSpace: string;
  id: string;
  isManager: boolean;
  isOwner: boolean;
  key: string;
  member: Member;
  memberId: string;
  rootFolderId: string;
  spaceLimit: string;
  updatedAt: string;
  usedSpace: string;
  workspaceId: string;
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
  avatar: string | null;
  backupsBucket: string | null;
  bridgeUser: string;
  credit: number;
  email: string;
  errorLoginCount: number;
  id: number;
  isEmailActivitySended: boolean;
  lastPasswordChangedAt: string | null;
  lastResend: string | null;
  lastname: string;
  name: string;
  referralCode: string;
  referrer: string | null;
  registerCompleted: boolean;
  rootFolderId: number;
  sharedWorkspace: boolean;
  syncDate: string | null;
  userId: string;
  username: string;
  uuid: string;
  welcomePack: boolean;
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

interface Invite {
  id: string;
  workspaceId: string;
  invitedUser: string;
  encryptionAlgorithm: string;
  encryptionKey: string;
  spaceLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PendingInvitesResponse = (Invite & {
  workspace: Workspace;
})[];

export type WorkspaceCredentialsResponse = {
  workspaceId: string;
  bucket: string;
  workspaceUserId: string;
  email: string;
  credentials: {
    networkPass: string;
    networkUser: string;
  };
};

export type EditWorkspaceDetailsBody = {
  workspaceId: string;
  name?: string;
  description?: string;
};

export type GetMemberDetailsResponse = {
  user: {
    name: string;
    lastname: string;
    email: string;
    uuid: string;
    id: number;
    avatar: string | null;
    memberId: string;
    workspaceId: string;
    spaceLimit: string;
    driveUsage: string;
    backupsUsage: string;
    deactivated: boolean;
  };
  teams: (Team & { isManager: boolean })[];
};
