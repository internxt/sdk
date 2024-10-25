import { Token } from '../auth';
import { ListAllSharedFoldersResponse, SharingMeta } from '../drive/share/types';
import {
  CreateFolderResponse,
  DriveFileData,
  FetchPaginatedFolderContentResponse,
  FetchTrashContentResponse,
} from '../drive/storage/types';
import { ApiSecurity, ApiUrl, AppDetails } from '../shared';
import { addResourcesTokenToHeaders, headersWithToken } from '../shared/headers';
import { HttpClient, RequestCanceler } from '../shared/http/client';
import {
  CreateFolderPayload,
  CreateTeamData,
  CreateWorkspaceSharingPayload,
  FileEntry,
  GetMemberDetailsResponse,
  GetMemberUsageResponse,
  InviteMemberBody,
  ListWorkspaceSharedItemsResponse,
  OrderByOptions,
  PendingInvitesResponse,
  Workspace,
  WorkspaceCredentialsDetails,
  WorkspaceMembers,
  WorkspacePendingInvitations,
  WorkspaceSetupInfo,
  WorkspacesResponse,
  WorkspaceTeamResponse,
  TeamMembers,
  WorkspaceUser,
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
    return headersWithToken(
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      this.apiSecurity.workspaceToken,
    );
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

  public getPendingInvites(): Promise<PendingInvitesResponse> {
    const limitQuery = '?limit=25';
    const offsetQuery = '&offset=0';
    const query = `${limitQuery}${offsetQuery}`;
    return this.client.get<PendingInvitesResponse>(`workspaces/invitations/${query}`, this.headers());
  }

  public validateWorkspaceInvite(inviteId: string): Promise<string> {
    return this.client.get<string>(`workspaces/invitations/${inviteId}validate`, this.headers());
  }

  /**
   * Uploads an avatar for a specific workspace.
   * @param workspaceId The UUID of the workspace to upload the avatar for.
   * @param avatar The avatar to upload.
   * @returns The response from the server.
   */
  public uploadWorkspaceAvatar(workspaceId: string, avatar: Blob) {
    const formData = new FormData();
    formData.append('file', avatar);

    return this.client.post<void>(`workspaces/${workspaceId}/avatar`, formData, {
      ...this.headers(),
      'content-type': 'multipart/form-data',
    });
  }

  public deleteWorkspaceAvatar(workspaceId: string): Promise<void> {
    return this.client.delete<void>(`workspaces/${workspaceId}/avatar`, this.headers());
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

  public getWorkspaceUsage(
    workspaceId: string,
  ): Promise<{ totalWorkspaceSpace: number; spaceAssigned: number; spaceUsed: number }> {
    return this.client.get(`workspaces/${workspaceId}/usage`, this.headers());
  }

  public editWorkspace(
    workspaceId: string,
    details: { name?: string; description?: string; address?: string },
  ): Promise<void> {
    return this.client.patch<void>(`workspaces/${workspaceId}`, details, this.headers());
  }

  public updateAvatar(workspaceId: string, payload: { avatar: Blob }) {
    const formData = new FormData();
    formData.set('file', payload.avatar);

    return this.client.post<{ avatar: string }>(`workspaces/${workspaceId}/avatar`, formData, this.headers());
  }

  public deleteAvatar(workspaceId: string) {
    return this.client.delete<void>(`workspaces/${workspaceId}/avatar`, this.headers());
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

  public deleteTeam({ workspaceId, teamId }: { workspaceId: string; teamId: string }): Promise<void> {
    return this.client.delete<void>(`workspaces/${workspaceId}/teams/${teamId}`, this.headers());
  }

  public getWorkspacesTeamMembers(teamId: string): Promise<TeamMembers> {
    return this.client.get<TeamMembers>(`workspaces/teams/${teamId}/members`, this.headers());
  }

  public addTeamUser(teamId: string, userUuid: string): Promise<void> {
    return this.client.post<void>(`/workspaces/teams/${teamId}/user/${userUuid}`, {}, this.headers());
  }

  public removeTeamUser(teamId: string, userUuid: string): Promise<void> {
    return this.client.delete<void>(`/workspaces/teams/${teamId}/user/${userUuid}`, this.headers());
  }

  public changeTeamManager(workspaceId: string, teamId: string, userUuid: string): Promise<void> {
    return this.client.patch<void>(
      `/workspaces/${workspaceId}/teams/${teamId}/manager`,
      { managerId: userUuid },
      this.headers(),
    );
  }

  public getPersonalTrash(
    workspaceId: string,
    type: 'file' | 'folder',
    offset = 0,
    limit = 50,
  ): Promise<FetchTrashContentResponse> {
    const offsetQuery = `?offset=${offset}`;
    const limitQuery = `&limit=${limit}`;
    const typeQuery = `&type=${type}`;
    const query = `${offsetQuery}${limitQuery}${typeQuery}`;
    return this.client.get<FetchTrashContentResponse>(`/workspaces/${workspaceId}/trash${query}`, this.headers());
  }

  public emptyPersonalTrash(workspaceId: string): Promise<void> {
    return this.client.delete<void>(`/workspaces/${workspaceId}/trash`, this.headers());
  }

  public changeUserRole(teamId: string, memberId: string, role: string): Promise<void> {
    return this.client.patch<void>(
      `/api/workspaces/teams/${teamId}/members/${memberId}/role`,
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

  public leaveWorkspace(workspaceId: string): Promise<void> {
    return this.client.delete<void>(`workspaces/${workspaceId}/members/leave`, this.headers());
  }

  public getMemberDetails(workspaceId: string, memberId: string): Promise<GetMemberDetailsResponse> {
    return this.client.get<GetMemberDetailsResponse>(`workspaces/${workspaceId}/members/${memberId}`, this.headers());
  }

  public modifyMemberUsage(workspaceId: string, memberId: string, spaceLimitBytes: number): Promise<WorkspaceUser> {
    return this.client.patch<WorkspaceUser>(
      `workspaces/${workspaceId}/members/${memberId}/usage`,
      {
        spaceLimit: spaceLimitBytes,
      },
      this.headers(),
    );
  }

  public getMemberUsage(workspaceId: string): Promise<GetMemberUsageResponse> {
    return this.client.get<GetMemberUsageResponse>(`workspaces/${workspaceId}/usage/member`, this.headers());
  }

  public deactivateMember(workspaceId: string, memberId: string): Promise<void> {
    return this.client.patch<void>(`workspaces/${workspaceId}/members/${memberId}/deactivate`, {}, this.headers());
  }

  public activateMember(workspaceId: string, memberId: string): Promise<void> {
    return this.client.patch<void>(`workspaces/${workspaceId}/members/${memberId}/activate`, {}, this.headers());
  }

  public removeMember(workspaceId: string, memberId: string): Promise<void> {
    return this.client.delete<void>(`workspaces/${workspaceId}/members/${memberId}`, this.headers());
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

  /**
   * Creates a new sharing for a workspace item.
   *
   * @param {CreateWorkspaceSharingPayload} options - The options for creating the sharing.
   * @param {string} options.workspaceId - The ID of the workspace.
   * @param {string} options.teamUUID - The UUID of the team.
   * @param {...CreateSharingPayload} options.createSharingPayload - The payload for creating the sharing.
   * @returns {Promise<SharingMeta>} A promise that resolves to the sharing metadata.
   */
  public shareItem({
    workspaceId,
    teamUUID,
    ...createSharingPayload
  }: CreateWorkspaceSharingPayload): Promise<SharingMeta> {
    return this.client.post(
      `workspaces/${workspaceId}/shared`,
      {
        ...createSharingPayload,
        sharedWith: teamUUID,
      },
      this.headers(),
    );
  }

  public validateWorkspaceInvitation(inviteId: string): Promise<{ uuid: string }> {
    return this.client.get<{ uuid: string }>(`workspaces/invitations/${inviteId}/validate`, this.headers());
  }

  public getWorkspaceTeamSharedFiles(
    workspaceId: string,
    teamId: string,
    orderBy?: OrderByOptions,
  ): [Promise<ListAllSharedFoldersResponse>, RequestCanceler] {
    const orderByQueryParam = orderBy ? `?orderBy=${orderBy}` : '';

    const { promise, requestCanceler } = this.client.getCancellable<ListAllSharedFoldersResponse>(
      `workspaces/${workspaceId}/teams/${teamId}/shared/files${orderByQueryParam}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  public getWorkspaceTeamSharedFolders(
    workspaceId: string,
    teamId: string,
    orderBy?: OrderByOptions,
  ): [Promise<ListAllSharedFoldersResponse>, RequestCanceler] {
    const orderByQueryParam = orderBy ? `?orderBy=${orderBy}` : '';

    const { promise, requestCanceler } = this.client.getCancellable<ListAllSharedFoldersResponse>(
      `workspaces/${workspaceId}/teams/${teamId}/shared/folders${orderByQueryParam}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }
  public getWorkspaceTeamSharedFolderFiles(
    workspaceId: string,
    teamId: string,
    sharedFolderUUID: string,
    page = 0,
    perPage = 50,
    token?: string,
    orderBy?: OrderByOptions,
  ): [Promise<ListWorkspaceSharedItemsResponse>, RequestCanceler] {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';
    let params = `?page=${page}&perPage=${perPage}`;
    if (token) params = params + `&token=${token}`;

    const { promise, requestCanceler } = this.client.getCancellable<ListWorkspaceSharedItemsResponse>(
      `workspaces/${workspaceId}/teams/${teamId}/shared/${sharedFolderUUID}/files${params}
      ${orderByQueryParam}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  public getWorkspaceTeamSharedFolderFolders(
    workspaceId: string,
    teamId: string,
    sharedFolderUUID: string,
    page = 0,
    perPage = 50,
    token?: string,
    orderBy?: OrderByOptions,
  ): [Promise<ListWorkspaceSharedItemsResponse>, RequestCanceler] {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';
    let params = `?page=${page}&perPage=${perPage}`;
    if (token) params = params + `&token=${token}`;

    const { promise, requestCanceler } = this.client.getCancellable<ListWorkspaceSharedItemsResponse>(
      `workspaces/${workspaceId}/teams/${teamId}/shared/${sharedFolderUUID}/folders${params}
      ${orderByQueryParam}`,
      this.headers(),
    );

    return [promise, requestCanceler];
  }

  public getWorkspace(workspaceId: string): Promise<Workspace> {
    return this.client.get<Workspace>(`workspaces/${workspaceId}`, this.headers());
  }
}

export * from './types';
