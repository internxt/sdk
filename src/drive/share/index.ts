import { ApiSecurity, ApiUrl, AppDetails } from '../../shared';
import {
  basicHeaders,
  basicHeadersWithPassword,
  headersWithToken,
  headersWithTokenAndPassword,
} from '../../shared/headers';
import { HttpClient } from '../../shared/http/client';
import {
  AcceptInvitationToSharedFolderPayload,
  CreateSharingPayload,
  GenerateShareLinkPayload,
  GetShareLinkFolderSizePayload,
  GetSharedDirectoryPayload,
  ListAllSharedFoldersResponse,
  ListPrivateSharedFoldersResponse,
  ListShareLinksResponse,
  ListSharedItemsResponse,
  PublicSharedItemInfo,
  RemoveUserRolePayload,
  Role,
  ShareDomainsResponse,
  ShareFolderWithUserPayload,
  ShareLink,
  SharedFolderSize,
  SharedFolderUser,
  SharedFoldersInvitationsAsInvitedUserResponse,
  SharingInfo,
  SharingInvite,
  SharingMeta,
  UpdateShareLinkPayload,
  UpdateUserRolePayload,
  UpdateUserRoleResponse,
} from './types';
import { ItemType } from 'src/workspaces';

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
      `sharings/shared-by-me/folders?page=${page}&perPage=${perPage}${orderByQueryParam}`,
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
      `sharings/shared-with-me/folders?page=${page}&perPage=${perPage}${orderByQueryParam}`,
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

    return this.client.get(`sharings/folders?page=${page}&perPage=${perPage}${orderByQueryParam}`, this.headers());
  }

  /**
   * Fetches all shared files.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   * @returns {Promise<ListAllSharedFoldersResponse>} A promise containing the list of shared folders.
   */
  public getAllSharedFiles(
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListAllSharedFoldersResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(`sharings/files?page=${page}&perPage=${perPage}${orderByQueryParam}`, this.headers());
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
      `sharings/shared-with/${folderUUID}?page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }

  /**
   * Get shared folder content
   * @param {string} sharedFolderId - The UUID of the shared folder.
   * @param {string} type - The item type for the query folders/files
   * @param {string} token - Key that enables invited users to navigate the folders
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   */
  public getSharedFolderContent(
    sharedFolderId: string,
    type: 'folders' | 'files',
    token: string | null,
    page = 0,
    perPage = 50,
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListSharedItemsResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(
      `sharings/items/${sharedFolderId}/${type}?token=${token}&page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }
  /**
   * Get public shared folder content
   * @param {string} sharedFolderId - The UUID of the shared folder.
   * @param {string} type - The item type for the query folders/files
   * @param {string} token - Key that enables invited users to navigate the folders
   * @param {number} page - The page number for pagination.
   * @param {number} perPage - The number of items per page for pagination.
   * @param {string} [orderBy] - The optional order criteria (e.g., 'views:ASC', 'createdAt:DESC').
   */
  public getPublicSharedFolderContent(
    sharedFolderId: string,
    type: 'folders' | 'files',
    token: string | null,
    page = 0,
    perPage = 50,
    code = '',
    orderBy?: 'views:ASC' | 'views:DESC' | 'createdAt:ASC' | 'createdAt:DESC',
  ): Promise<ListSharedItemsResponse> {
    const orderByQueryParam = orderBy ? `&orderBy=${orderBy}` : '';

    return this.client.get(
      // eslint-disable-next-line max-len
      `sharings/public/items/${sharedFolderId}/${type}?token=${token}&code=${code}&page=${page}&perPage=${perPage}${orderByQueryParam}`,
      this.headers(),
    );
  }

  /**
   * Get the role of a user on a folder.
   *
   * @param {string} options.sharingId - The unique identifier of the sharing.
   * @returns {Promise<Role>} A promise containing the role of the current user in the sharing.
   */
  public getUserRole(sharingId: string): Promise<Role> {
    return this.client.get(`sharings/${sharingId}/role`, this.headers());
  }

  /**
   * Update the role of a user on a folder.
   *
   * @param {UpdateUserRolePayload} options - The options for updating the user's role on the folder.
   * @param {string} options.sharingId - The unique identifier of the user to whom we will update the role.
   * @param {string} options.newRoleId - The new role Id.
   * @returns {Promise<UpdateRoleFolderResponse>} A promise that resolves when the user's role is updated.
   */
  public updateUserRole({ sharingId, newRoleId }: UpdateUserRolePayload): Promise<UpdateUserRoleResponse> {
    return this.client.put(
      `sharings/${sharingId}/role`,
      {
        roleId: newRoleId,
      },
      this.headers(),
    );
  }

  /**
   * Remove user from shared folder.
   *
   * @param {UpdateUserRolePayload} options - The options for updating the user's role on the folder.
   * @param {string} options.itemType - The unique identifier of the folder.
   * @param {string} options.itemId - The identifier of the role to assign to the user.
   * @param {string} options.userId - The role Id how we want to delete.
   * @returns {Promise<UpdateRoleFolderResponse>} A promise that resolves when the user's role is updated.
   */
  public removeUserRole({ itemType, itemId, userId }: RemoveUserRolePayload): Promise<UpdateUserRoleResponse> {
    return this.client.delete(`sharings/${itemType}/${itemId}/users/${userId}`, this.headers());
  }

  /**
   * Get private folder data.
   *
   * @param {string} itemId - The itemId of the folder.
   * @param {string} itemType - The itemType of the folder (file | folder).
   * @returns {Promise<{ data: SharingInvite[] }>} A promise containing the private folder data.
   */

  public getSharedFolderInvitations({ itemId, itemType }: { itemId: string; itemType: ItemType }): Promise<any[]> {
    return this.client.get(`sharings/${itemType}/${itemId}/invites`, this.headers());
  }

  /**
   * Get all invitations for a user.
   * @param limit - The number of items per page for pagination.
   * @param offset - The page number for pagination.
   * @returns {Promise<invites: any>} A promise containing the list of invitations.
   */

  public getSharedFolderInvitationsAsInvitedUser({
    limit,
    offset,
  }: {
    limit?: number;
    offset?: number;
  }): Promise<{ invites: SharedFoldersInvitationsAsInvitedUserResponse[] }> {
    return this.client.get(`sharings/invites?limit=${limit}&offset=${offset}`, this.headers());
  }

  /**
   * Share a private folder with a user.
   *
   * @param {ShareFolderWithUserPayload} options - The options for sharing the private folder with a user.
   * @param {string} options.itemId - The id of the item to share.
   * @param {string} options.itemType - The type of the item to share (folder | file).
   * @param {string} options.sharedWith - The email address of the user to share the folder with.
   * @param {string} options.encryptionKey - Owner\'s encryption key encrypted with the invited user\'s public key. This field should not be empty if the invitation type is "OWNER".
   * @param {string} options.encryptionAlgorithm - Encryption algorithm used to encrypt the encryption key. This field should not be empty if the invitation type is "OWNER".
   * @param {string} options.type - Owner's encryption key encrypted with the invited user's public key.
   * @param {string} options.roleId - The id of the role to assign to the user.
   * @param {string} options.notifyUser - If it has to notify the users
   * @param {string} options.notificationMessage - Message of the notificacion
   *
   *
   * @returns {Promise<SharingInvite>} A promise that resolves when the folder is shared with the user.
   */

  public inviteUserToSharedFolder(createInviteDto: ShareFolderWithUserPayload): Promise<SharingInvite> {
    return this.client.post(
      'sharings/invites/send',
      {
        ...createInviteDto,
        type: 'OWNER',
      },
      this.headers(),
    );
  }

  /**
   * Create a sharing.
   */
  public createSharing(createSharingPayload: CreateSharingPayload): Promise<SharingMeta> {
    return this.client.post(
      'sharings',
      {
        ...createSharingPayload,
      },
      this.headers(),
    );
  }

  /**
   * Get sharing meta with code
   */
  public getSharingMeta(sharingId: string, code: string, password?: string): Promise<SharingMeta> {
    const extraHeaders = password ? { 'x-share-password': password } : {};
    return this.client.get(`sharings/${sharingId}/meta?code=${code}`, {
      ...this.headers(),
      ...extraHeaders,
    });
  }

  /**
   * Add/edit sharing Password
   * @param {string} sharingId - id of sharing.
   * @param {string} encryptedPassword - password encrypted with CODE as key
   * @returns {Promise<SharingMeta>} A promise that returns the sharing info with the new encrypted password
   */
  public saveSharingPassword(sharingId: string, encryptedPassword: string): Promise<SharingMeta> {
    return this.client.patch(
      `sharings/${sharingId}/password`,
      {
        encryptedPassword,
      },
      this.headers(),
    );
  }

  /**
   * Remove password protection from sharing
   * @param {string} sharingId - id of sharing.
   * @returns {Promise<void>} A promise that resolves when password was successfully deleted.
   */
  public removeSharingPassword(sharingId: string): Promise<void> {
    return this.client.delete(`sharings/${sharingId}/password`, this.headers());
  }

  /**
   * Get public information of the item shared.
   * @param {string} sharingId - id of sharing.
   * @returns {Promise<PublicSharedItemInfo>} A promise that returns data of the public shared item.
   */
  public getPublicSharedItemInfo(sharingId: string): Promise<PublicSharedItemInfo> {
    return this.client.get(`sharings/public/${sharingId}/item`, this.headers());
  }

  /**
   * Request access to shared folder.
   */

  public requestUserToSharedFolder(createInviteDto: ShareFolderWithUserPayload): Promise<void> {
    return this.client.post(
      'sharings/invites/send',
      {
        ...createInviteDto,
        type: 'SELF',
      },
      this.headers(),
    );
  }

  /**
   * Check if the expirationDate of invite is valid.
   * @param {string} invitationId - The id of the invitation.
   
   * @returns {Promise<{uuid: string}>}  A promise returning the uuid of the invitation if valid.
   */
  public validateInviteExpiration(invitationId: string): Promise<{ uuid: string }> {
    return this.client.get(`sharings/invites/${invitationId}/validate`, this.headers());
  }

  /**
   * Share a private folder with a user.
   * @param {string} invitationId - The id of the invitation.
   * @param {ShareFolderWithUserPayload} options - The options for sharing the private folder with a user.
   * @param {string} options.encryptionKey - The encryption key (just in case the invitation is a request).
   * @param {string} options.itemType - The encryption algorithm (just in case the invitation is a request).
   
   * @returns {Promise<void>} A promise that resolves when the folder is shared with the user.
   */

  public acceptSharedFolderInvite({
    invitationId,
    acceptInvite,
    token,
  }: {
    invitationId: string;
    acceptInvite?: AcceptInvitationToSharedFolderPayload;
    token?: string;
  }): Promise<void> {
    const headers = this.getRequestHeaders(token);

    return this.client.post(
      `sharings/invites/${invitationId}/accept`,
      {
        acceptInvite,
      },
      headers,
    );
  }

  /**
   * Change Sharing Mode.
   * @param {string} options.itemType - folder | file
   * @param {string} options.itemId - id of folder or file
   * @param {string} options.sharingType - New Sharing type.
   
   * @returns {Promise<void>} A promise that resolves when sharing mode has been updated.
   */

  public updateSharingType({
    itemId,
    itemType,
    sharingType,
  }: {
    itemId: string;
    itemType: string;
    sharingType: string;
  }): Promise<void> {
    const headers = this.headers();

    return this.client.put(
      `sharings/${itemType}/${itemId}/type`,
      {
        sharingType,
      },
      headers,
    );
  }

  /**
   * Get Sharing type
   * @param {string} options.itemType - folder | file
   * @param {string} options.itemId - id of folder or file
   * @returns {Promise<SharingMeta>} A promise that returns the sharing data.
   */

  public getSharingType({ itemId, itemType }: { itemId: string; itemType: string }): Promise<SharingMeta> {
    const headers = this.headers();

    return this.client.get(`sharings/${itemType}/${itemId}/type`, headers);
  }

  /**
   * Get Sharing information
   * @param {string} options.itemType - folder | file
   * @param {string} options.itemId - id of folder or file
   * @returns {Promise<SharingInfo>} A promise that returns information about the shared item.
   */
  public getSharingInfo({ itemId, itemType }: { itemId: string; itemType: string }): Promise<SharingInfo> {
    const headers = this.headers();

    return this.client.get(`sharings/${itemType}/${itemId}/info`, headers);
  }

  public declineSharedFolderInvite(invitationId: string, token?: string): Promise<void> {
    const headers = this.getRequestHeaders(token);
    return this.client.delete(`sharings/invites/${invitationId}`, headers);
  }

  /**
   * Fetches roles for sharing items.
   *
   * @returns {Promise<PrivateSharingRolesResponse>} A promise containing the list of sharing roles.
   */

  public getSharingRoles(): Promise<Role[]> {
    return this.client.get('/sharings/roles', this.headers());
  }

  public getAllAccessUsers({
    itemType,
    folderId,
  }: {
    itemType: string;
    folderId: string;
  }): Promise<Record<'users', any[]> | Record<'error', string>> {
    return this.client.get(`sharings/shared-with/${itemType}/${folderId}`, this.headers());
  }

  /**
   * Stop sharing folder
   * @param {string} itemType - Type of the sharing to delete
   * @param {string} itemId - Id of the sharing to delete
   * @returns
   */
  public async stopSharingFolder(itemType: string, itemId: string): Promise<void> {
    await this.client.delete(`sharings/${itemType}/${itemId}`, this.headers());
  }

  /**
   * Returns the needed headers for the module requests
   * @private
   */
  private headers(password?: string) {
    const args: [string, string, string, string | undefined] = [
      this.appDetails.clientName,
      this.appDetails.clientVersion,
      this.apiSecurity.token,
      this.apiSecurity.workspaceToken,
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

  /**
   * Get request headers with optional authorization token.
   *
   * @param {string} [token] - Optional authorization token.
   * @returns {Object} - Request headers object.
   */
  private getRequestHeaders(token?: string) {
    const headers = {
      ...this.headers(),
    };

    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    return headers;
  }

  /**
   * Gets the size of a shared folder given sharing id
   *
   * @param {string} sharingId - Sharing ID.
   * @returns {Promise<SharedFolderSize>}
   */
  public getSharedFolderSize(id: string): Promise<SharedFolderSize> {
    return this.client.get<SharedFolderSize>(`sharings/public/${id}/folder/size`, this.headers());
  }
}
