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

export type WorkspacesResponse = WorkspaceData[];

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
