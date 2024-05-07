import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  CreateTeamData,
  InviteMemberBody,
  WorkspaceSetupInfo,
  WorkspaceTeamResponse,
  WorkspacesResponse,
} from './types';

export class Workspaces {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Workspaces(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers() {
    return headersWithToken(this.appDetails.clientName, this.appDetails.clientVersion, this.apiSecurity.token);
  }

  private getRequestHeaders(token?: string) {
    const headers = {
      ...this.headers(),
    };

    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    return headers;
  }

  public getWorkspaces(): Promise<WorkspacesResponse> {
    return this.client.get<WorkspacesResponse>('workspaces/', this.headers());
  }

  public getPendingWorkspaces(): Promise<WorkspacesResponse> {
    return this.client.get<WorkspacesResponse>('workspaces/pending-setup', this.headers());
  }

  public setupWorkspace({
    workspaceId,
    name,
    address,
    description,
    encryptedMnemonic,
  }: WorkspaceSetupInfo): Promise<void> {
    return this.client.patch<void>(
      `workspaces/${workspaceId}/setup`,
      { name, address, description, encryptedMnemonic },
      this.headers(),
    );
  }

  public createTeam({ workspaceId, name, managerId }: CreateTeamData): Promise<void> {
    return this.client.post<void>(
      `workspaces/${workspaceId}/teams`,
      {
        name,
        managerId,
      },
      this.headers(),
    );
  }

  public getWorkspacesTeams(workspaceId: string): Promise<WorkspaceTeamResponse> {
    return this.client.get<WorkspaceTeamResponse>(`workspaces/${workspaceId}/teams`, this.headers());
  }

  public editTeam({ teamId, name }: { teamId: string; name: string }): Promise<void> {
    return this.client.patch<void>(
      `workspaces/teams/${teamId}`,
      {
        name,
      },
      this.headers(),
    );
  }

  public deleteTeam({ teamId }: { teamId: string }): Promise<void> {
    return this.client.delete<void>(`workspaces/teams/${teamId}`, this.headers());
  }

  public getWorkspacesTeamMembers(workspaceId: string, teamId: string): Promise<void> {
    return this.client.get<void>(`workspaces/${workspaceId}/teams/${teamId}/members`, this.headers());
  }

  public addTeamUser(teamId: string, userUuid: string): Promise<void> {
    return this.client.post<void>(`/workspaces/teams/${teamId}/user/${userUuid}`, {}, this.headers());
  }

  public removeTeamUser(teamId: string, userUuid: string): Promise<void> {
    return this.client.delete<void>(`/workspaces/teams/${teamId}/user/${userUuid}`, this.headers());
  }

  public changeTeamManager(teamId: string): Promise<void> {
    return this.client.patch<void>(`/workspaces/teams/${teamId}/manager`, {}, this.headers());
  }

  public changeUserRole(teamId: string, memberId: string, role: string): Promise<void> {
    return this.client.patch<void>(
      `/api/workspaces/{workspaceId}/teams/${teamId}/members/${memberId}/role`,
      {
        role,
      },
      this.headers(),
    );
  }

  public inviteMemberToWorkspace({
    workspaceId,
    invitedUserEmail,
    spaceLimitBytes,
    encryptedMnemonicInBase64,
    encryptionAlgorithm = 'aes-256-gcm',
  }: InviteMemberBody): Promise<void> {
    return this.client.post<void>(
      `workspaces/${workspaceId}/members/invite`,
      {
        invitedUser: invitedUserEmail,
        spaceLimit: spaceLimitBytes,
        encryptionKey: encryptedMnemonicInBase64,
        encryptionAlgorithm,
      },
      this.headers(),
    );
  }

  public acceptInvitation(inviteId: string, token: string): Promise<void> {
    return this.client.post<void>(
      'workspaces/invitations/accept',
      {
        inviteId,
      },
      this.getRequestHeaders(token),
    );
  }

  public declineInvitation(inviteId: string, token: string): Promise<void> {
    return this.client.post<void>(
      'workspaces/invitations/decline',
      {
        inviteId,
      },
      this.getRequestHeaders(token),
    );
  }
}

export * from './types';
