import { SharedFiles, SharedFolders } from '../drive/share/types';

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
  hybridModeEnabled: boolean;
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
  avatar: null | string;
  rootFolderId: string;
  phoneNumber: null | string;
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
  hybridModeEnabled: boolean | false;
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

export type TeamMember = {
  name: string;
  lastname: string;
  email: string;
  id: number;
  uuid: string;
  avatar: string | null;
};

export type TeamMembers = TeamMember[];

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
  message: string;
  hybridModeEnabled: boolean | false;
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

export type FileEntry = {
  name: string;
  bucket: string;
  fileId: string;
  encryptVersion: string;
  folderUuid: string;
  size: number;
  plainName: string;
  type: string;
  modificationTime: string;
  date: string;
};

export interface WorkspaceCredentials {
  networkPass: string;
  networkUser: string;
}

export interface WorkspaceCredentialsDetails {
  workspaceId: string;
  bucket: string;
  workspaceUserId: string;
  email: string;
  credentials: WorkspaceCredentials;
  tokenHeader: string;
}

export interface CreateFolderPayload {
  workspaceId: string;
  plainName: string;
  parentFolderUuid: string;
}

export type WorkspacePendingInvitations = {
  id: string;
  workspaceId: string;
  invitedUser: string;
  encryptionAlgorithm: string;
  encryptionKey: string;
  spaceLimit: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    lastname: string;
    email: string;
    uuid: string;
    avatar: string | null;
  };
  isGuessInvite: boolean;
};

export type ItemType = 'file' | 'folder';

export interface CreateWorkspaceSharingPayload {
  workspaceId: string;
  itemId: string;
  itemType: ItemType;
  teamUUID: string;
  roleId: string;
}

export type ListWorkspaceSharedItemsResponse = {
  items: SharedFiles[] | SharedFolders[];
  token: string;
  role: string;
  parent: Parent;
  bucket: string;
  encryptionKey: null | string;
};

export type Parent = {
  uuid: string;
  name: string;
};

export type OrderByOptions = 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC';

export type GetMemberUsageResponse = { backupsUsage: number; driveUsage: number; spaceLimit: number };
