import { Token } from '../auth';
import { CreateFolderResponse, DriveFileData, FetchPaginatedFolderContentResponse } from '../drive/storage/types';
import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { addResourcesTokenToHeaders, headersWithToken } from '../shared/headers';
import { HttpClient, RequestCanceler } from '../shared/http/client';
import {
  CreateFolderPayload,
  CreateTeamData,
  FileEntry,
  InviteMemberBody,
  WorkspaceCredentialsDetails,
  WorkspaceMembers,
  WorkspaceSetupInfo,
  WorkspaceTeamResponse,
  WorkspacesResponse,
  WorkspacePendingInvitations,
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

  public getWorkspacesMembers(workspaceId: string): Promise<WorkspaceMembers> {
    return this.client.get<WorkspaceMembers>(`workspaces/${workspaceId}/members`, this.headers());
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
    message,
  }: InviteMemberBody): Promise<void> {
    return this.client.post<void>(
      `workspaces/${workspaceId}/members/invite`,
      {
        invitedUser: invitedUserEmail,
        spaceLimit: spaceLimitBytes,
        encryptionKey: encryptedMnemonicInBase64,
        encryptionAlgorithm,
        message: message,
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
    return this.client.delete<void>(`workspaces/invitations/${inviteId}`, this.getRequestHeaders(token));
  }

  public getWorkspaceCredentials(workspaceId: string): Promise<WorkspaceCredentialsDetails> {
    return this.client.get<WorkspaceCredentialsDetails>(`workspaces/${workspaceId}/credentials`, this.headers());
  }

  public createFileEntry(fileEntry: FileEntry, workspaceId: string, resourcesToken?: Token): Promise<DriveFileData> {
    return this.client.post(
      `/workspaces/${workspaceId}/files`,
      {
        name: fileEntry.name,
        bucket: fileEntry.bucket,
        fileId: fileEntry.fileId,
        encryptVersion: fileEntry.encryptVersion,
        folderUuid: fileEntry.folderUuid,
        size: fileEntry.size,
        plainName: fileEntry.plainName,
        type: fileEntry.type,
        modificationTime: fileEntry.modificationTime,
        date: fileEntry.date,
      },
      addResourcesTokenToHeaders(this.headers(), resourcesToken),
    );
  }

  /**
   * Creates a new folder in the specified workspace.
   *
   * @param {CreateFolderPayload} options - The options for creating the folder.
   * @param {string} options.workspaceId - The ID of the workspace.
   * @param {string} options.plainName - The plain name of the folder.
   * @param {string} options.parentFolderUuid - The UUID of the parent folder.
   * @return {[Promise<CreateFolderResponse>, RequestCanceler]} A tuple containing a promise to get the API response and a function to cancel the request.
   */
  public createFolder({
    workspaceId,
    plainName,
    parentFolderUuid,
  }: CreateFolderPayload): [Promise<CreateFolderResponse>, RequestCanceler] {
    const { promise, requestCanceler } = this.client.postCancellable<CreateFolderResponse>(
      `/workspaces/${workspaceId}/folders`,
      {
        name: plainName,
        parentFolderUuid: parentFolderUuid,
      },
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Retrieves a paginated list of folders within a specific folder in a workspace.
   *
   * @param {string} workspaceId - The ID of the workspace.
   * @param {string} folderUUID - The UUID of the folder.
   * @param {number} [offset=0] - The position of the first file to return.
   * @param {number} [limit=50] - The max number of files to be returned.
   * @param {string} [sort=''] - The reference column to sort it.
   * @param {string} [order=''] - The order to be followed.
   * @return {[Promise<FetchPaginatedFolderContentResponse>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFolders(
    workspaceId: string,
    folderUUID: string,
    offset = 0,
    limit = 50,
    sort = '',
    order = '',
  ): [Promise<FetchPaginatedFolderContentResponse>, RequestCanceler] {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const sortQuery = sort !== '' ? `&sort=${sort}` : '';
    const orderQuery = order !== '' ? `&order=${order}` : '';

    const query = `${offsetQuery}${limitQuery}${sortQuery}${orderQuery}`;

    const { promise, requestCanceler } = this.client.getCancellable<FetchPaginatedFolderContentResponse>(
      `workspaces/${workspaceId}/folders/${folderUUID}/folders/${query}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  /**
   * Retrieves a paginated list of files within a specific folder in a workspace.
   *
   * @param {string} workspaceId - The ID of the workspace.
   * @param {string} folderUUID - The UUID of the folder.
   * @param {number} [offset=0] - The position of the first file to return.
   * @param {number} [limit=50] - The max number of files to be returned.
   * @param {string} [sort=''] - The reference column to sort it.
   * @param {string} [order=''] - The order to be followed.
   * @return {[Promise<FetchPaginatedFolderContentResponse>, RequestCanceler]} An array containing a promise to get the API response and a function to cancel the request.
   */
  public getFiles(
    workspaceId: string,
    folderUUID: string,
    offset = 0,
    limit = 50,
    sort = '',
    order = '',
  ): [Promise<FetchPaginatedFolderContentResponse>, RequestCanceler] {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const sortQuery = sort !== '' ? `&sort=${sort}` : '';
    const orderQuery = order !== '' ? `&order=${order}` : '';

    const query = `${offsetQuery}${limitQuery}${sortQuery}${orderQuery}`;

    const { promise, requestCanceler } = this.client.getCancellable<FetchPaginatedFolderContentResponse>(
      `workspaces/${workspaceId}/folders/${folderUUID}/files/${query}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  public getWorkspacePendingInvitations(
    workspaceId: string,
    limit: number,
    offset: number,
  ): Promise<WorkspacePendingInvitations[]> {
    const limitQuery = `?limit=${limit}`;
    const offsetQuery = `&offset=${offset}`;

    const query = `${limitQuery}${offsetQuery}`;

    return this.client.get<WorkspacePendingInvitations[]>(
      `workspaces/${workspaceId}/invitations/${query}`,
      this.headers(),
    );
  }

  public validateWorkspaceInvitation(inviteId: string): Promise<{ uuid: string }> {
    return this.client.get<{ uuid: string }>(`workspaces/invitations/${inviteId}/validate`, this.headers());
  }
}

export * from './types';
