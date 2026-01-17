import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'prisma/generated/enums';

/**
 * ProjectMemberService handles all business logic related to project memberships
 * This is the core of the ACL (Access Control List) system
 */
@Injectable()
export class ProjectMemberService {
  constructor(private prisma: PrismaService) { }

  /**
   * Add a user to a project with a specific role
   * @param projectId - The project to add the user to
   * @param userId - The user to add
   * @param role - The role to assign (defaults to MEMBER)
   * @returns The created ProjectMember record
   */
  async addMember(
    projectId: number,
    userId: number,
    role: ProjectRole = ProjectRole.MEMBER,
  ) {
    // Check if user is already a member
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create the membership
    return this.prisma.projectMember.create({
      data: {
        userId,
        projectId,
        workspaceId: project.workspaceId,
        role,
      },
      include: {
        user: true,
        project: true,
      },
    });
  }

  /**
   * Remove a user from a project
   * @param projectId - The project to remove the user from
   * @param userId - The user to remove
   */
  async removeMember(projectId: number, userId: number) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this project');
    }

    // Prevent removing the last owner
    if (member.role === ProjectRole.OWNER) {
      const ownerCount = await this.prisma.projectMember.count({
        where: {
          projectId,
          role: ProjectRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner of the project',
        );
      }
    }

    return this.prisma.projectMember.delete({
      where: {
        userId_projectId: { userId, projectId },
      },
    });
  }

  /**
   * Update a member's role in a project
   * @param projectId - The project
   * @param userId - The user whose role to update
   * @param newRole - The new role to assign
   */
  async updateMemberRole(
    projectId: number,
    userId: number,
    newRole: ProjectRole,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this project');
    }

    // Prevent changing the last owner's role
    if (member.role === ProjectRole.OWNER && newRole !== ProjectRole.OWNER) {
      const ownerCount = await this.prisma.projectMember.count({
        where: {
          projectId,
          role: ProjectRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot change the role of the last owner',
        );
      }
    }

    return this.prisma.projectMember.update({
      where: {
        userId_projectId: { userId, projectId },
      },
      data: {
        role: newRole,
      },
      include: {
        user: true,
        project: true,
      },
    });
  }

  /**
   * Get all members of a project
   * @param projectId - The project to get members for
   * @returns Array of ProjectMember records with user details
   */
  async getProjectMembers(projectId: number) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: true,
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, MEMBER, VIEWER
        { joinedAt: 'asc' },
      ],
    });
  }

  /**
   * Get all projects a user has access to
   * @param userId - The user to get projects for
   * @returns Array of ProjectMember records with project details
   */
  async getUserProjects(userId: number) {
    return this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            responsible: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });
  }

  /**
   * Check if a user has access to a project (any role)
   * @param userId - The user to check
   * @param projectId - The project to check access for
   * @returns true if user has access, false otherwise
   */
  async checkAccess(userId: number, projectId: number): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    return !!member;
  }

  /**
   * Check if a user has a specific role or higher in a project
   * @param userId - The user to check
   * @param projectId - The project to check
   * @param requiredRoles - Array of acceptable roles
   * @returns The user's membership if they have permission
   * @throws ForbiddenException if user doesn't have required role
   */
  async checkPermission(
    userId: number,
    projectId: number,
    requiredRoles: ProjectRole[],
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return member;
  }

  /**
   * Get a user's role in a project
   * @param userId - The user
   * @param projectId - The project
   * @returns The user's role or null if not a member
   */
  async getUserRole(
    userId: number,
    projectId: number,
  ): Promise<ProjectRole | null> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    return member?.role || null;
  }

  /**
   * Invite a user to a project by email
   * @param projectId - The project to invite to
   * @param inviterUserId - The user doing the inviting (must be OWNER or ADMIN)
   * @param inviteeEmail - Email of the user to invite
   * @param role - Role to assign to the invited user
   * @returns The created ProjectMember record
   */
  async inviteUser(
    projectId: number,
    inviterUserId: number,
    inviteeEmail: string,
    role: ProjectRole = ProjectRole.MEMBER,
  ) {
    // Verify inviter has permission (OWNER or ADMIN)
    await this.checkPermission(inviterUserId, projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    // Find the user to invite by email
    const invitee = await this.prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (!invitee) {
      throw new NotFoundException(`User with email ${inviteeEmail} not found`);
    }

    // Add the user to the project
    return this.addMember(projectId, invitee.id, role);
  }

  /**
   * Check if a user can perform an action based on their role
   * Role hierarchy: OWNER > ADMIN > MEMBER > VIEWER
   */
  canPerformAction(userRole: ProjectRole, action: string): boolean {
    const permissions = {
      [ProjectRole.OWNER]: [
        'view',
        'create',
        'edit',
        'delete',
        'invite',
        'manage_settings',
        'manage_members',
      ],
      [ProjectRole.ADMIN]: ['view', 'create', 'edit', 'delete', 'invite'],
      [ProjectRole.MEMBER]: ['view', 'create', 'edit_own'],
      [ProjectRole.VIEWER]: ['view'],
    };

    return permissions[userRole]?.includes(action) || false;
  }
}
