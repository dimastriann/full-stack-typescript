import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceInput } from './dto/create-workspace.input';
import { UpdateWorkspaceInput } from './dto/update-workspace.input';
import { WorkspaceRole } from 'prisma/generated/enums';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  get includeRelation() {
    return {
      members: {
        include: {
          user: true,
        },
      },
      projects: true,
      projectStages: true,
      taskStages: true,
    };
  }

  async create(createWorkspaceInput: CreateWorkspaceInput, userId: number) {
    const workspace = await this.prisma.workspace.create({
      data: {
        ...createWorkspaceInput,
      },
      include: this.includeRelation,
    });

    // Add creator as OWNER
    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: userId,
        role: WorkspaceRole.OWNER,
      },
    });

    return workspace;
  }

  async findAll(userId: number) {
    // Return workspaces where user is a member
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: this.includeRelation,
    });
  }

  async findOne(id: number, userId: number) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: this.includeRelation,
    });

    if (!workspace) return null;

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return workspace;
  }

  async update(
    id: number,
    updateWorkspaceInput: UpdateWorkspaceInput,
    userId: number,
  ) {
    await this.checkPermission(id, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    return this.prisma.workspace.update({
      where: { id },
      data: updateWorkspaceInput,
      include: this.includeRelation,
    });
  }

  async remove(id: number, userId: number) {
    await this.checkPermission(id, userId, [WorkspaceRole.OWNER]);

    return this.prisma.workspace.delete({
      where: { id },
    });
  }

  async checkPermission(
    workspaceId: number,
    userId: number,
    roles: WorkspaceRole[],
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return member;
  }

  async addMember(
    workspaceId: number,
    userId: number,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ) {
    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
      include: {
        user: true,
      },
    });
  }

  async inviteUser(
    workspaceId: number,
    inviterId: number,
    email: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
  ) {
    // Check permissions
    await this.checkPermission(workspaceId, inviterId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return this.addMember(workspaceId, user.id, role);
  }

  async updateMemberRole(
    workspaceId: number,
    adminId: number,
    userId: number,
    newRole: WorkspaceRole,
  ) {
    // Check permissions (only OWNER or ADMIN can change roles)
    await this.checkPermission(workspaceId, adminId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new Error('User is not a member of this workspace');
    }

    // Prevent changing the last owner's role
    if (
      member.role === WorkspaceRole.OWNER &&
      newRole !== WorkspaceRole.OWNER
    ) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot change the role of the last owner');
      }
    }

    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      data: {
        role: newRole,
      },
      include: {
        user: true,
      },
    });
  }

  async removeMember(workspaceId: number, adminId: number, userId: number) {
    // Allow removing yourself, OR must be OWNER/ADMIN to remove others
    if (adminId !== userId) {
      await this.checkPermission(workspaceId, adminId, [
        WorkspaceRole.OWNER,
        WorkspaceRole.ADMIN,
      ]);
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new Error('User is not a member of this workspace');
    }

    // Prevent removing the last owner
    if (member.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last owner of the workspace');
      }
    }

    return this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
  }
}
