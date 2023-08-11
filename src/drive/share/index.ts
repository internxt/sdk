import {
  basicHeaders,
  basicHeadersWithPassword,
  headersWithToken,
  headersWithTokenAndPassword,
} from '../../shared/headers';
import {
  GenerateShareLinkPayload,
  GetSharedDirectoryPayload,
  GetShareLinkFolderSizePayload,
  GrantSharePrivilegesToUserResponse,
  ListAllSharedFoldersResponse,
  ListPrivateSharedFoldersResponse,
  ListShareLinksResponse,
  PrivateSharedFolder,
  PrivateSharingRolesResponse,
  SharedFolderUser,
  ShareDomainsResponse,
  ShareLink,
  SharePrivateFolderWithUserPayload,
  UpdateUserRolePayload,
  UpdateUserRoleResponse,
  UpdateShareLinkPayload,
} from './types';
import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import { HttpClient } from '../../shared/http/client';

export * as ShareTypes from './types';

export class Share {
  private readonly client: HttpClient;
  private readonly appDetails: AppDetails;
  private readonly apiSecurity: ApiSecurity;

  public static client(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    return new Share(apiUrl, appDetails, apiSecurity);
  }

  private constructor(apiUrl: ApiUrl, appDetails: AppDetails, apiSecurity: ApiSecurity) {
    this.client = HttpClient.create(apiUrl, apiSecurity.unauthorizedCallback);
    this.appDetails = appDetails;
    this.apiSecurity = apiSecurity;
  }

  /**
   * Fetches the list of shared items
   */
  public getShareLinks(
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListShareLinksResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(`/storage/share/list?page=${page}&perPage=${perPage}${orderByQueryParam}`, this.headers());
  }

  /**
   * Creates a new link to share a file or folder
   * @param payload
   */
  public createShareLink(payload: GenerateShareLinkPayload): Promise<{
    created: boolean;
    token: string;
    code: string;
  }> {
    const types = ['file', 'folder'];
    if (!types.includes(payload.type)) {
      throw new Error('Invalid type');
    }

    return this.client.post(
      `/storage/share/${payload.type}/${payload.itemId}`,
      {
        timesValid: payload.timesValid,
        encryptedMnemonic: payload.encryptedMnemonic,
        itemToken: payload.itemToken,
        bucket: payload.bucket,
        encryptedCode: payload.encryptedCode,
        plainPassword: payload.plainPassword,
      },
      this.headers(),
    );
  }

  /**
   * Update share link
   * @param payload
   */
  public updateShareLink(payload: UpdateShareLinkPayload): Promise<ShareLink> {
    return this.client.put(
      `/storage/share/${payload.itemId}`,
      {
        plainPassword: payload.plainPassword,
      },
      this.headers(),
    );
  }

  /**
   * Delete share link by id
   * @param payload
   */
  public deleteShareLink(shareId: string): Promise<{ deleted: boolean; shareId: string }> {
    return this.client.delete(`/storage/share/${shareId}`, this.headers());
  }

  /**
   * Increment share view by token
   * @param token
   */
  public incrementShareViewByToken(token: string): Promise<{ incremented: boolean; token: string }> {
    return this.client.put(`/storage/share/${token}/view`, {}, this.headers());
  }

  /**
   * Fetches data of a shared file
   * @param token
   */
  public getShareLink(token: string, password?: string): Promise<ShareLink> {
    const headers = password ? this.basicHeadersWithPassword(password) : this.basicHeaders();
    return this.client.get(`/storage/share/${token}`, headers);
  }

  /**
   * Fetches paginated folders or files of a specific share link
   * @param payload
   */
  public getShareLinkDirectory(payload: GetSharedDirectoryPayload): Promise<any> {
    const types = ['file', 'folder'];
    if (!types.includes(payload.type)) {
      throw new Error('Invalid type');
    }
    let headers = this.basicHeaders();
    if (payload.password) {
      headers = this.basicHeadersWithPassword(payload.password);
    }
    return this.client.get(
      `/storage/share/down/${payload.type}s?token=${payload.token}&folderId=${payload.folderId}&parentId=${
        payload.parentId
      }&page=${payload.page}&perPage=${payload.perPage}${payload.code ? '&code=' + payload.code : ''}`,
      headers,
    );
  }

  public getShareDomains(): Promise<ShareDomainsResponse> {
    return this.client.get('/storage/share/domains', this.headers());
  }

  /**
   * Get size of folder in share links
   * @param payload
   */
  public getShareLinkFolderSize(payload: GetShareLinkFolderSizePayload): Promise<any> {
    return this.client.get(`/storage/share/${payload.itemId}/folder/${payload.folderId}/size`, this.basicHeaders());
  }

  /**
   * Fetches all folders shared by a user.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   * @returns {Promise<ListPrivateSharedFoldersResponse>} A promise containing the list of shared folders.
   */
  public getSentSharedFolders(
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListPrivateSharedFoldersResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(
      `private-sharing/sent/folders?page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }

  /**
   * Fetches folders shared with a user.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   * @returns {Promise<ListPrivateSharedFoldersResponse>} A promise containing the list of shared folders.
   */
  public getReceivedSharedFolders(
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListPrivateSharedFoldersResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(
      `private-sharing/receive/folders?page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }

  /**
   * Fetches all shared folders.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   * @returns {Promise<ListAllSharedFoldersResponse>} A promise containing the list of shared folders.
   */
  public getAllSharedFolders(
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListAllSharedFoldersResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(
      `private-sharing/folders?page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }

  /**
   * Get all users with access to a shared folder.
   *
   * @param {string} folderUUID - The UUID of the folder.
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   * @returns {Promise<{ users: SharedFolderUser[] }>} A promise containing the list of users with access to the folder.
   */
  public getSharedFolderUsers(
    folderUUID: string,
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<{ users: SharedFolderUser[] }> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(
      `private-sharing/shared-with/by-folder-id/${folderUUID}?page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }

  /**
   * Get private folder data.
   *
   * @param {string} folderUUID - The UUID of the folder.
   * @returns {Promise<{ data: PrivateSharedFolder }>} A promise containing the private folder data.
   */
  public getPrivateSharedFolder(folderUUID: string): Promise<{ data: PrivateSharedFolder }> {
    return this.client.get(`private-sharing/by-folder-id/${folderUUID}`, this.headers());
  }

  /**
   * Grant privileges of folder to a user.
   *
   * @param {string} userUuid - The UUID of the user.
   * @param {string} privateFolderId - The UUID of the shared folder.
   * @param {string} roleId - The id of the role.
   * @returns {Promise<GrantSharePrivilegesToUserResponse>} A promise with message field
   */
  public grantSharePrivilegesToUser(
    userUuid: string,
    privateFolderId: string,
    roleId: string,
  ): Promise<GrantSharePrivilegesToUserResponse> {
    return this.client.post(
      'private-sharing/grant-privileges',
      {
        userUuid,
        privateFolderId,
        roleId,
      },
      this.headers(),
    );
  }

  /**
   * Update the role of a user on a folder.
   *
   * @param {UpdateUserRolePayload} options - The options for updating the user's role on the folder.
   * @param {string} options.folderUUID - The unique identifier of the folder.
   * @param {string} options.roleId - The identifier of the role to assign to the user.
   * @param {string} options.userUUID - The email address of the user.
   * @returns {Promise<UpdateRoleFolderResponse>} A promise that resolves when the user's role is updated.
   */
  public updateUserRole({ folderUUID, roleId, userUUID }: UpdateUserRolePayload): Promise<UpdateUserRoleResponse> {
    return this.client.put(
      `private-sharing/role/${roleId}`,
      {
        folderId: folderUUID,
        userId: userUUID,
      },
      this.headers(),
    );
  }

  /**
   * Share a private folder with a user.
   *
   * @param {SharePrivateFolderWithUserPayload} options - The options for sharing the private folder with a user.
   * @param {string} options.emailToShare - The email address of the user to share the folder with.
   * @param {string} options.privateFolderId - The unique identifier of the private folder.
   * @param {string} options.roleId - The identifier of the role to assign to the user for the shared folder.
   * @param {string} options.encryptionKey - The encryption key for the shared folder.
   * @returns {Promise<void>} A promise that resolves when the folder is shared with the user.
   */
  public sharePrivateFolderWithUser({
    emailToShare,
    privateFolderId,
    roleId,
    encryptionKey,
  }: SharePrivateFolderWithUserPayload): Promise<void> {
    return this.client.post(
      'private-sharing/share',
      {
        email: emailToShare,
        folderId: privateFolderId,
        roleId,
        encryptionKey,
      },
      this.headers(),
    );
  }

  /**
   * Fetches roles for private sharing items.
   *
   * @returns {Promise<PrivateSharingRolesResponse>} A promise containing the list of private sharing roles.
   */
  public getPrivateSharingRoles(): Promise<PrivateSharingRolesResponse> {
    return this.client.get('private-sharing/roles', this.headers());
  }

  /**
   * Stop sharing folder
   *
   * @param {string} folderUUID - The unique identifier of the folder.
   * @returns {Promise<{ stopped: boolean }>} A promise that resolves with an object indicating whether the sharing was stopped.
   */
  public stopSharingFolder(folderUUID: string): Promise<{ stoped: boolean }> {
    return this.client.delete(`/private-sharing/stop/folder-id/${folderUUID}`, this.headers());
  }

  /**
   * Remove user from the shared users list of a folder.
   * @param {string} folderUUID - The UUID of the shared folder.
   * @param {string} userUUID - The UUID of the user to be removed.
   * @returns {Promise<{ removed: boolean }>} A promise indicating whether the user was removed.
   */
  public removeUserFromSharedFolder(folderUUID: string, userUUID: string): Promise<{ removed: boolean }> {
    return this.client.delete(`/private-sharing/remove/folder-id/${folderUUID}/user-id/${userUUID}`, this.headers());
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers(password?: string) {
    const args: [string, string, string] = [
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
    ];
    if (password) {
      return headersWithTokenAndPassword(...args, password);
    }
    return headersWithToken(...args);
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private basicHeaders() {
    return basicHeaders(this.appDetails.clientName, this.appDetails.clientVersion);
  }

  /**
   * Used to send the password in shares
   * @private
   */
  private basicHeadersWithPassword(password: string) {
    return basicHeadersWithPassword(this.appDetails.clientName, this.appDetails.clientVersion, password);
  }
}
