import { Injectable, ForbiddenException } from '@nestjs/common';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private projectMemberService: ProjectMemberService,
  ) {}

  get includeRelation() {
    return {
      responsible: true,
      tasks: true,
      timesheets: true,
      attachments: true,
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
    // Create the project
    const project = await this.prisma.project.create({
      data: createProjectInput,
      include: { ...this.includeRelation },
    });

    // Automatically add the creator as OWNER
    await this.projectMemberService.addMember(
      project.id,
      creatorUserId,
      ProjectRole.OWNER,
    );

    // Return the project with updated members
    return this.prisma.project.findUnique({
      where: { id: project.id },
      include: { ...this.includeRelation },
    });
  }

  /**
   * Get all projects that the user has access to
   * This replaces the old findAll() that returned ALL projects
   */
  async findAll(userId: number, skip?: number, take?: number) {
    // Get all project memberships for this user
    const memberships = await this.projectMemberService.getUserProjects(userId);

    // Extract project IDs
    const projectIds = memberships.map((m) => m.projectId);

    // Return only projects where user is a member
    return this.prisma.project.findMany({
      where: {
        id: { in: projectIds },
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

    return this.prisma.project.update({
      where: { id },
      data: { ...updateProjectInput },
      include: { ...this.includeRelation },
    });
  }

  /**
   * Delete a project - only OWNER can delete
   */
  async delete(id: number, userId: number) {
    // Verify user is OWNER
    await this.projectMemberService.checkPermission(userId, id, [
      ProjectRole.OWNER,
    ]);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
