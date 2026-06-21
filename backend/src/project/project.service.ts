import { Injectable, ForbiddenException } from '@nestjs/common';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import {
  ActivityLogService,
  ActivityLogDetails,
} from 'src/activity-log/activity-log.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private projectMemberService: ProjectMemberService,
    private activityLog: ActivityLogService,
  ) {}

  get includeRelation() {
    return {
      responsible: true,
      tasks: true,
      timesheets: true,
      attachments: true,
      workspace: true,
      stage: true,
      members: {
        include: {
          user: true,
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: true,
          replies: {
            include: {
              user: true,
            },
          },
        },
      },
    };
  }

  /**
   * Create a new project and automatically add the creator as OWNER
   * This is the KEY to the ACL system - every project has at least one owner
   */
  async create(createProjectInput: CreateProjectInput, creatorUserId: number) {
    // Verify user is a member of the workspace
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: createProjectInput.workspaceId,
          userId: creatorUserId,
        },
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenException(
        'You must be a member of the workspace to create a project',
      );
    }

    // Generate unique project key
    const key = await this.generateProjectKey(createProjectInput.name);

    // Create the project
    const project = await this.prisma.project.create({
      data: {
        ...createProjectInput,
        key,
      },
      include: { ...this.includeRelation },
    });

    // Automatically add the creator as OWNER
    await this.projectMemberService.addMember(
      project.id,
      creatorUserId,
      ProjectRole.OWNER,
    );

    await this.activityLog.log('CREATE', 'PROJECT', project.id, creatorUserId, {
      projectId: project.id,
      workspaceId: project.workspaceId,
      details: { name: project.name },
    });

    // Return the project with updated members
    return this.prisma.project.findUnique({
      where: { id: project.id },
      include: { ...this.includeRelation },
    });
  }

  /**
   * Get all projects that the user has access to, optionally filtered by workspace
   */
  async findAll(
    userId: number,
    workspaceId?: number,
    skip?: number,
    take?: number,
  ) {
    // Get all project memberships for this user
    const memberships = await this.projectMemberService.getUserProjects(userId);

    // Extract project IDs
    const projectIds = memberships.map((m) => m.projectId);

    // Return only projects where user is a member
    return this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
        ...(workspaceId && { workspaceId }),
      },
      orderBy: {
        sequence: 'asc',
      },
      skip,
      take,
      include: {
        ...this.includeRelation,
      },
    });
  }

  /**
   * Get a single project - verify user has access first
   */
  async findOne(id: number, userId: number) {
    // Verify user has access to this project
    const hasAccess = await this.projectMemberService.checkAccess(userId, id);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.prisma.project.findUnique({
      where: { id },
      include: { ...this.includeRelation },
    });
  }

  /**
   * Update a project - verify user has OWNER or ADMIN role
   */
  async update(
    id: number,
    updateProjectInput: UpdateProjectInput,
    userId: number,
  ) {
    // Verify user has permission to update (OWNER or ADMIN)
    await this.projectMemberService.checkPermission(userId, id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const oldProject = await this.prisma.project.findUnique({
      where: { id },
    });

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { ...updateProjectInput },
      include: { ...this.includeRelation },
    });

    if (oldProject) {
      const changes: ActivityLogDetails = {};
      if (updateProjectInput.name && updateProjectInput.name !== oldProject.name) {
        changes.name = { from: oldProject.name, to: updateProjectInput.name };
      }
      if (
        updateProjectInput.stageId &&
        updateProjectInput.stageId !== oldProject.stageId
      ) {
        changes.stageId = {
          from: oldProject.stageId,
          to: updateProjectInput.stageId,
        };
      }
      if (
        updateProjectInput.priority &&
        updateProjectInput.priority !== oldProject.priority
      ) {
        changes.priority = {
          from: oldProject.priority,
          to: updateProjectInput.priority,
        };
      }

      if (Object.keys(changes).length > 0) {
        await this.activityLog.log('UPDATE', 'PROJECT', id, userId, {
          projectId: id,
          workspaceId: updatedProject.workspaceId,
          details: changes,
        });
      }
    }

    return updatedProject;
  }

  /**
   * Delete a project - only OWNER can delete
   */
  async delete(id: number, userId: number) {
    // Verify user is OWNER
    await this.projectMemberService.checkPermission(userId, id, [
      ProjectRole.OWNER,
    ]);

    const projectToDelete = await this.prisma.project.findUnique({
      where: { id },
    });

    const deletedProject = await this.prisma.project.delete({
      where: { id },
    });

    if (projectToDelete) {
      await this.activityLog.log('DELETE', 'PROJECT', id, userId, {
        projectId: id,
        workspaceId: projectToDelete.workspaceId,
        details: { name: projectToDelete.name },
      });
    }

    return deletedProject;
  }

  private async generateProjectKey(name: string): Promise<string> {
    let prefix = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (prefix.length < 2) prefix = 'PRJ';

    const latestProject = await this.prisma.project.findFirst({
      where: {
        key: {
          startsWith: prefix + '-',
        },
      },
      orderBy: {
        key: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestProject && latestProject.key) {
      const parts = latestProject.key.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }
}
