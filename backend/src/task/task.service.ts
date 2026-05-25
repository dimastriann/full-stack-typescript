import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMemberService: ProjectMemberService,
  ) {}

  get includeRelation() {
    return {
      user: true,
      project: true,
      stage: true,
      reporter: true,
      parentTask: true,
      subtasks: true,
      attachments: true,
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

  async create(createTaskInput: CreateTaskInput, userId: number) {
    // Verify user has access to the project
    await this.projectMemberService.checkPermission(
      userId,
      createTaskInput.projectId,
      [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER],
    );

    return this.prisma.task.create({
      data: createTaskInput,
      include: this.includeRelation,
    });
  }

  async findAll(
    userId: number,
    skip?: number,
    take?: number,
    projectId?: number,
    cursor?: number,
  ) {
    let projectIds: number[] = [];

    if (projectId) {
      // If specific project is requested, verify access
      await this.projectMemberService.checkAccess(userId, projectId);
      projectIds = [projectId];
    } else {
      // Otherwise, get all accessible projects
      const memberships =
        await this.projectMemberService.getUserProjects(userId);
      projectIds = memberships.map((m) => m.projectId);
    }

    return this.prisma.task.findMany({
      skip: skip !== undefined ? skip : (cursor !== undefined ? 1 : undefined),
      take,
      cursor: cursor !== undefined ? { id: cursor } : undefined,
      where: {
        projectId: { in: projectIds },
      },
      orderBy: {
        sequence: 'asc',
      },
      include: this.includeRelation,
    });
  }

  async findOne(id: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        stage: true,
        reporter: true,
        parentTask: true,
        subtasks: true,
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
        attachments: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user has access to the project this task belongs to
    await this.projectMemberService.checkAccess(userId, task.projectId);

    return task;
  }

  async update(id: number, updateTaskInput: UpdateTaskInput, userId: number) {
    const task = await this.findOne(id, userId);

    // Additional check: maybe only OWNER/ADMIN/ASSIGNED_USER can update?
    // For now, any MEMBER of the project can update tasks.
    await this.projectMemberService.checkPermission(userId, task.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    return this.prisma.task.update({
      where: { id },
      data: updateTaskInput,
      include: this.includeRelation,
    });
  }

  async remove(id: number, userId: number) {
    const task = await this.findOne(id, userId);

    // Only OWNER or ADMIN can delete tasks
    await this.projectMemberService.checkPermission(userId, task.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.task.delete({ where: { id } });
  }
}
