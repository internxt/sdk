import sinon from 'sinon';
import { headersWithToken } from '../shared/headers';
import { HttpClient } from '../shared/http/client';
import {
  GetMemberDetailsResponse,
  PendingInvitesResponse,
  WorkspaceCredentialsDetails,
  WorkspaceSetupInfo,
  WorkspaceTeamResponse,
  Workspaces,
  WorkspacesResponse,
} from './index';

const httpClient = HttpClient.create('');

describe('Workspaces service tests', () => {
  beforeEach(() => {
    sinon.stub(HttpClient, 'create').returns(httpClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Workspaces methods', () => {
    const workspacesResponse: WorkspacesResponse = {
      availableWorkspaces: [
        {
          workspaceUser: {
            id: '1',
            memberId: 'member1',
            key: 'user_key_1',
            workspaceId: 'workspace1',
            spaceLimit: '10GB',
            driveUsage: '2GB',
            backupsUsage: '1GB',
            deactivated: false,
            createdAt: '2024-04-30T12:00:00Z',
            updatedAt: '2024-04-30T12:00:00Z',
            freeSpace: '0',
            isManager: false,
            isOwner: false,
            rootFolderId: 'asflaksfoau0su0fewnlsd',
            member: {
              avatar: null,
              backupsBucket: null,
              bridgeUser: 'email@email.com',
              credit: 0,
              email: 'email@email.com',
              errorLoginCount: 0,
              id: 7,
              isEmailActivitySended: true,
              lastPasswordChangedAt: null,
              lastResend: null,
              lastname: 'Lastname',
              name: 'Name',
              referralCode: 'referralCode',
              referrer: null,
              registerCompleted: true,
              rootFolderId: 2,
              sharedWorkspace: true,
              syncDate: null,
              userId: 'asflaksfoau0su0fewnlsd',
              username: 'email@email.com',
              uuid: 'asflaksfoau0su0fewnlsd',
              welcomePack: true,
            },
            usedSpace: '0',
          },
          workspace: {
            id: 'workspace1',
            ownerId: 'owner1',
            address: '123 Main St',
            name: 'Workspace 1',
            description: 'Description for Workspace 1',
            defaultTeamId: 'team1',
            workspaceUserId: '1',
            setupCompleted: true,
            createdAt: '2024-04-30T12:00:00Z',
            updatedAt: '2024-04-30T12:00:00Z',
            avatar: null,
            rootFolderId: 'asflaksfoau0su0fewnlsd',
            phoneNumber: null,
          },
        },
        {
          workspaceUser: {
            id: '2',
            memberId: 'member2',
            key: 'user_key_2',
            workspaceId: 'workspace2',
            spaceLimit: '15GB',
            driveUsage: '5GB',
            backupsUsage: '3GB',
            deactivated: false,
            createdAt: '2024-04-30T12:00:00Z',
            updatedAt: '2024-04-30T12:00:00Z',
            freeSpace: '0',
            isManager: false,
            isOwner: false,
            rootFolderId: 'asflaksfoau0su0fewnlsd',
            member: {
              avatar: null,
              backupsBucket: null,
              bridgeUser: 'email@email.com',
              credit: 0,
              email: 'email@email.com',
              errorLoginCount: 0,
              id: 7,
              isEmailActivitySended: true,
              lastPasswordChangedAt: null,
              lastResend: null,
              lastname: 'Lastname',
              name: 'Name',
              referralCode: 'referralCode',
              referrer: null,
              registerCompleted: true,
              rootFolderId: 2,
              sharedWorkspace: true,
              syncDate: null,
              userId: 'asflaksfoau0su0fewnlsd',
              username: 'email@email.com',
              uuid: 'asflaksfoau0su0fewnlsd',
              welcomePack: true,
            },
            usedSpace: '0',
          },
          workspace: {
            id: 'workspace2',
            ownerId: 'owner2',
            address: '456 Elm St',
            name: 'Workspace 2',
            description: 'Description for Workspace 2',
            defaultTeamId: 'team2',
            workspaceUserId: '2',
            setupCompleted: true,
            createdAt: '2024-04-30T12:00:00Z',
            updatedAt: '2024-04-30T12:00:00Z',
            avatar: null,
            rootFolderId: 'asflaksfoau0su0fewnlsd',
            phoneNumber: null,
          },
        },
      ],
      pendingWorkspaces: [],
    };
    describe('getWorkspaces', () => {
      it('should return the expected workspaces when getWorkspaces is called', async () => {
        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'get').resolves(workspacesResponse);

        const response = await client.getWorkspaces();

        expect(response).toEqual(workspacesResponse);
      });
    });

    describe('getPendingWorkspaces', () => {
      it('should return the pending workspaces when getPendingWorkspaces is called', async () => {
        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'get').resolves(workspacesResponse);

        const response = await client.getPendingWorkspaces();

        expect(response).toEqual(workspacesResponse);
      });
    });

    describe('setupWorkspace', () => {
      it('should set up the workspace successfully', async () => {
        const workspaceData = {
          name: 'Workspace Name',
          address: 'Workspace Address',
          description: 'Workspace Description',
          encryptedMnemonic: 'encryptedMnemonic',
        };
        const workspaceSetupInfo: WorkspaceSetupInfo = {
          workspaceId: 'workspaceId',
          ...workspaceData,
        };

        const { client, headers } = clientAndHeaders();
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.setupWorkspace(workspaceSetupInfo);

        expect(patchCall.firstCall.args).toEqual([
          `workspaces/${workspaceSetupInfo.workspaceId}/setup`,
          workspaceData,
          headers,
        ]);
      });
    });

    describe('getWorkspaceUsage', () => {
      it('should return workspace usage when getWorkspaceUsage is called', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';

        const usageResponse = {
          totalWorkspaceSpace: 1024 * 1024 * 1024 * 2,
          spaceAssigned: 1024 * 1024 * 1024 * 1.5,
          spaceUsed: 1024 * 1024 * 1024 * 1,
        };

        const getCall = sinon.stub(httpClient, 'get').resolves(usageResponse);

        const response = await client.getWorkspaceUsage(workspaceId);

        expect(getCall.firstCall.args).toEqual([`workspaces/${workspaceId}/usage`, headers]);
        expect(response).toEqual(usageResponse);
      });
    });

    describe('getWorkspacesTeams', () => {
      it('should return the teams of a workspace when getWorkspacesTeams is called', async () => {
        const workspaceId = 'workspaceId';
        const workspaceTeamsResponse: WorkspaceTeamResponse = [
          {
            membersCount: 3,
            team: {
              id: 'team1',
              name: 'Team 1',
              managerId: 'manager1',
              workspaceId: 'workspace1',
              createdAt: '2024-04-30T12:00:00Z',
              updatedAt: '2024-04-30T12:00:00Z',
            },
          },
          {
            membersCount: 5,
            team: {
              id: 'team2',
              name: 'Team 2',
              managerId: 'manager2',
              workspaceId: 'workspace1',
              createdAt: '2024-04-30T12:00:00Z',
              updatedAt: '2024-04-30T12:00:00Z',
            },
          },
          {
            membersCount: 2,
            team: {
              id: 'team3',
              name: 'Team 3',
              managerId: 'manager3',
              workspaceId: 'workspace2',
              createdAt: '2024-04-30T12:00:00Z',
              updatedAt: '2024-04-30T12:00:00Z',
            },
          },
        ];

        const { client } = clientAndHeaders();
        sinon.stub(httpClient, 'get').resolves(workspaceTeamsResponse);

        const response = await client.getWorkspacesTeams(workspaceId);

        expect(response).toEqual(workspaceTeamsResponse);
      });
    });

    describe('createTeam', () => {
      it('should create a team successfully', async () => {
        const teamData = { name: 'team', managerId: 'asdf-123ad-f123' };
        const createTeamData = {
          workspaceId: '123sdf',
          ...teamData,
        };
        const { client, headers } = clientAndHeaders();
        const postCall = sinon.stub(httpClient, 'post').resolves({ status: 200 });
        const response = await client.createTeam(createTeamData);

        expect(postCall.firstCall.args).toEqual(['workspaces/123sdf/teams', teamData, headers]);
        expect(response).toEqual({ status: 200 });
      });
    });

    describe('editTeam', () => {
      it('should edit the team successfully', async () => {
        const teamId = 'teamId';
        const newName = 'New Team Name';

        const { client, headers } = clientAndHeaders();
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.editTeam({ teamId, name: newName });

        expect(patchCall.firstCall.args).toEqual([`workspaces/teams/${teamId}`, { name: newName }, headers]);
      });
    });

    describe('deleteTeam', () => {
      it('should delete the team successfully', async () => {
        const workspaceId = 'workspaceId';
        const teamId = 'teamId';
        const { client, headers } = clientAndHeaders();
        const deleteCall = sinon.stub(httpClient, 'delete').resolves();

        await client.deleteTeam({ workspaceId, teamId });

        expect(deleteCall.firstCall.args).toEqual([`workspaces/${workspaceId}/teams/${teamId}`, headers]);
      });
    });

    describe('getWorkspacesTeamMembers', () => {
      it('should return the members of a team when getWorkspacesTeamMembers is called', async () => {
        const teamId = 'teamId';
        const { client, headers } = clientAndHeaders();
        const getCall = sinon.stub(httpClient, 'get').resolves();

        await client.getWorkspacesTeamMembers(teamId);

        expect(getCall.firstCall.args).toEqual([`workspaces/teams/${teamId}/members`, headers]);
      });
    });

    describe('addTeamUser', () => {
      it('should add a user to the team successfully', async () => {
        const teamId = 'teamId';
        const userUuid = 'userUuid';
        const { client, headers } = clientAndHeaders();
        const postCall = sinon.stub(httpClient, 'post').resolves();

        await client.addTeamUser(teamId, userUuid);

        expect(postCall.firstCall.args).toEqual([`/workspaces/teams/${teamId}/user/${userUuid}`, {}, headers]);
      });
    });

    describe('removeTeamUser', () => {
      it('should remove a user from the team successfully', async () => {
        const teamId = 'teamId';
        const userUuid = 'userUuid';
        const { client, headers } = clientAndHeaders();
        const deleteCall = sinon.stub(httpClient, 'delete').resolves();

        await client.removeTeamUser(teamId, userUuid);

        expect(deleteCall.firstCall.args).toEqual([`/workspaces/teams/${teamId}/user/${userUuid}`, headers]);
      });
    });

    describe('changeTeamManager', () => {
      it('should change the team manager successfully', async () => {
        const workspaceId = 'workspaceId';
        const teamId = 'teamId';
        const userUuid = 'userUuid';
        const { client, headers } = clientAndHeaders();
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.changeTeamManager(workspaceId, teamId, userUuid);

        expect(patchCall.firstCall.args).toEqual([
          `/workspaces/${workspaceId}/teams/${teamId}/manager`,
          { managerId: userUuid },
          headers,
        ]);
      });
    });

    describe('changeUserRole', () => {
      it('should change the user role in the team successfully', async () => {
        const teamId = 'teamId';
        const memberId = 'memberId';
        const role = 'newRole';
        const { client, headers } = clientAndHeaders();
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.changeUserRole(teamId, memberId, role);

        expect(patchCall.firstCall.args).toEqual([
          `/api/workspaces/teams/${teamId}/members/${memberId}/role`,
          { role },
          headers,
        ]);
      });
    });

    describe('inviteMemberToWorkspace', () => {
      it('should invite a member to the workspace successfully', async () => {
        const workspaceId = 'workspaceId';
        const invitedUserEmail = 'test@example.com';
        const spaceLimitBytes = 1024;
        const encryptedMnemonicInBase64 = 'encryptedMnemonic';
        const encryptionAlgorithm = 'aes-256-gcm';
        const { client, headers } = clientAndHeaders();
        const postCall = sinon.stub(httpClient, 'post').resolves();
        const message = 'Test message';

        await client.inviteMemberToWorkspace({
          workspaceId,
          invitedUserEmail,
          spaceLimitBytes,
          encryptedMnemonicInBase64,
          encryptionAlgorithm,
          message,
        });

        expect(postCall.firstCall.args).toEqual([
          `workspaces/${workspaceId}/members/invite`,
          {
            invitedUser: invitedUserEmail,
            spaceLimit: spaceLimitBytes,
            encryptionKey: encryptedMnemonicInBase64,
            encryptionAlgorithm: 'aes-256-gcm',
            message: message,
          },
          headers,
        ]);
      });
    });

    describe('modifyMemberUsage', () => {
      it('should modify the member usage limit successfully', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const memberId = 'memberId';
        const spaceLimitBytes = 1024 * 1024 * 1024;

        const workspaceUserResponse = {
          id: 'memberId',
          spaceLimit: '1GB',
          driveUsage: '500MB',
          backupsUsage: '200MB',
          deactivated: false,
          member: {
            id: 1,
            name: 'MemberName',
            lastname: 'MemberLastName',
            email: 'email@email.com',
          },
        };

        const patchCall = sinon.stub(httpClient, 'patch').resolves(workspaceUserResponse);

        const response = await client.modifyMemberUsage(workspaceId, memberId, spaceLimitBytes);

        expect(patchCall.firstCall.args).toEqual([
          `workspaces/${workspaceId}/members/${memberId}/usage`,
          { spaceLimit: spaceLimitBytes },
          headers,
        ]);
        expect(response).toEqual(workspaceUserResponse);
      });
    });

    describe('getPendingInvites', () => {
      it('should return the pending invites when getPendingInvites is called', async () => {
        const { client } = clientAndHeaders();
        const pendingInvitesResponse: PendingInvitesResponse = [
          {
            id: '1',
            workspaceId: 'workspace1',
            invitedUser: 'user1',
            encryptionAlgorithm: 'AES',
            encryptionKey: 'key1',
            spaceLimit: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            workspace: {
              address: '123 Main St',
              createdAt: '2024-04-30T12:00:00Z',
              updatedAt: '2024-04-30T12:00:00Z',
              defaultTeamId: 'team1',
              description: 'Description for Workspace 1',
              id: 'workspace1',
              name: 'Workspace 1',
              ownerId: 'owner1',
              setupCompleted: true,
              workspaceUserId: '1',
              avatar: null,
              rootFolderId: 'asdf-123-asdf',
              phoneNumber: null,
            },
          },
        ];
        sinon.stub(httpClient, 'get').resolves(pendingInvitesResponse);

        const response = await client.getPendingInvites();

        expect(response).toEqual(pendingInvitesResponse);
      });
    });

    describe('validateWorkspaceInvite', () => {
      it('should return the inviteId successfully', async () => {
        const { client } = clientAndHeaders();
        const inviteId = 'inviteId';

        sinon.stub(httpClient, 'get').resolves(inviteId);

        const response = await client.validateWorkspaceInvite(inviteId);

        expect(response).toEqual(inviteId);
      });
    });

    describe('deleteWorkspaceAvatar', () => {
      it('should delete the workspace avatar successfully', async () => {
        const workspaceId = 'workspaceId';
        const { client, headers } = clientAndHeaders();
        const deleteCall = sinon.stub(httpClient, 'delete').resolves();

        await client.deleteWorkspaceAvatar(workspaceId);

        expect(deleteCall.firstCall.args).toEqual([`workspaces/${workspaceId}/avatar`, headers]);
      });
    });

    describe('getWorkspaceCredentials', () => {
      it('should return the workspace credentials successfully', async () => {
        const { client } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const getWorkspaceCredentialsResponse: WorkspaceCredentialsDetails = {
          workspaceId,
          bucket: 'bucket',
          workspaceUserId: 'workspaceUserId',
          email: 'email',
          credentials: {
            networkPass: 'networkPass',
            networkUser: 'networkUser',
          },
          tokenHeader: 'tokenHeader',
        };

        sinon.stub(httpClient, 'get').resolves(getWorkspaceCredentialsResponse);

        const response = await client.getWorkspaceCredentials(workspaceId);

        expect(response).toEqual(getWorkspaceCredentialsResponse);
      });
    });

    describe('getPersonalTrash', () => {
      it('should return the personal trash successfully', async () => {
        const { client } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const getPersonalTrashResponse = {
          bucket: 'bucket',
          files: [],
          folders: [],
        };

        sinon.stub(httpClient, 'get').resolves(getPersonalTrashResponse);

        const response = await client.getPersonalTrash(workspaceId, 'file');

        expect(response).toEqual(getPersonalTrashResponse);
      });
    });

    describe('emptyPersonalTrash', () => {
      it('should empty the personal trash successfully', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const deleteCall = sinon.stub(httpClient, 'delete').resolves();

        await client.emptyPersonalTrash(workspaceId);

        expect(deleteCall.firstCall.args).toEqual([`/workspaces/${workspaceId}/trash`, headers]);
      });
    });

    describe('editWorkspace', () => {
      it('should edit the workspace details successfully', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const workspaceData = {
          name: 'Workspace Name',
          description: 'Workspace Description',
          address: 'Workspace Address',
        };
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.editWorkspace(workspaceId, {
          description: workspaceData.description,
          name: workspaceData.name,
          address: workspaceData.address,
        });

        expect(patchCall.firstCall.args).toEqual([`workspaces/${workspaceId}`, workspaceData, headers]);
      });
    });

    describe('leaveWorkspace', () => {
      it('should leave the workspace successfully', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const deleteCall = sinon.stub(httpClient, 'delete').resolves();

        await client.leaveWorkspace(workspaceId);

        expect(deleteCall.firstCall.args).toEqual([`workspaces/${workspaceId}/members/leave`, headers]);
      });
    });

    describe('getMemberDetails', () => {
      it('should return the member details successfully', async () => {
        const { client } = clientAndHeaders();
        const memberId = 'memberId';
        const getMemberDetailsResponse: GetMemberDetailsResponse = {
          user: {
            avatar: null,
            backupsUsage: '1324',
            deactivated: false,
            driveUsage: '12332411',
            email: 'email@email.com',
            id: 123,
            lastname: 'Lastname',
            memberId: 'memberId',
            name: 'Name',
            spaceLimit: '5368709120',
            uuid: 'asflaksfoau0su0fewnlsd',
            workspaceId: 'workspaceId',
          },
          teams: [
            {
              isManager: false,
              id: 'teamId',
              name: 'teamName',
              managerId: 'managerId',
              createdAt: '2024-04-30T12:00:00Z',
              updatedAt: '2024-04-30T12:00:00Z',
              workspaceId: 'workspaceId',
            },
          ],
        };

        sinon.stub(httpClient, 'get').resolves(getMemberDetailsResponse);

        const response = await client.getMemberDetails('workspaceId', memberId);

        expect(response).toEqual(getMemberDetailsResponse);
      });
    });

    describe('deactivateMember', () => {
      it('should deactivate the member successfully', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const memberId = 'memberId';
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.deactivateMember(workspaceId, memberId);

        expect(patchCall.firstCall.args).toEqual([
          `workspaces/${workspaceId}/members/${memberId}/deactivate`,
          {},
          headers,
        ]);
      });
    });

    describe('activateMember', () => {
      it('should activate the member successfully', async () => {
        const { client, headers } = clientAndHeaders();
        const workspaceId = 'workspaceId';
        const memberId = 'memberId';
        const patchCall = sinon.stub(httpClient, 'patch').resolves();

        await client.activateMember(workspaceId, memberId);

        expect(patchCall.firstCall.args).toEqual([
          `workspaces/${workspaceId}/members/${memberId}/activate`,
          {},
          headers,
        ]);
      });
    });

    describe('getWorkspace', () => {
      it('should return the workspace billing address successfully', async () => {
        const workspace = {
          id: 'workspace2',
          ownerId: 'owner2',
          address: '456 Elm St',
          name: 'Workspace 2',
          description: 'Description for Workspace 2',
          defaultTeamId: 'team2',
          workspaceUserId: '2',
          setupCompleted: true,
          createdAt: '2024-04-30T12:00:00Z',
          updatedAt: '2024-04-30T12:00:00Z',
          avatar: null,
          rootFolderId: 'asflaksfoau0su0fewnlsd',
        };
        const { client } = clientAndHeaders();
        const workspaceId = 'workspaceId';

        sinon.stub(httpClient, 'get').resolves(workspace);

        const response = await client.getWorkspace(workspaceId);

        expect(response).toEqual(workspace);
      });
    });
  });
});

function clientAndHeaders(
  apiUrl = '',
  clientName = 'c-name',
  clientVersion = '0.1',
  token = 'my-token',
  workspaceToken = 'workspaceToken',
): {
  client: Workspaces;
  headers: object;
} {
  const appDetails = {
    clientName,
    clientVersion,
  };
  const apiSecurity = {
    token,
    workspaceToken,
  };
  const client = Workspaces.client(apiUrl, appDetails, apiSecurity);
  const headers = headersWithToken(clientName, clientVersion, token, workspaceToken);
  return { client, headers };
}
