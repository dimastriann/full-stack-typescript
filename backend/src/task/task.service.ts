import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import {
  ActivityLogService,
  ActivityLogDetails,
} from 'src/activity-log/activity-log.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMemberService: ProjectMemberService,
    private readonly activityLog: ActivityLogService,
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

    const task = await this.prisma.task.create({
      data: createTaskInput,
      include: this.includeRelation,
    });

    await this.activityLog.log('CREATE', 'TASK', task.id, userId, {
      projectId: task.projectId,
      workspaceId: task.project.workspaceId,
      details: { title: task.title },
    });

    return task;
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
      skip: skip !== undefined ? skip : cursor !== undefined ? 1 : undefined,
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

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskInput,
      include: this.includeRelation,
    });

    const changes: ActivityLogDetails = {};
    if (updateTaskInput.title && updateTaskInput.title !== task.title) {
      changes.title = { from: task.title, to: updateTaskInput.title };
    }
    if (updateTaskInput.stageId && updateTaskInput.stageId !== task.stageId) {
      changes.stageId = { from: task.stageId, to: updateTaskInput.stageId };
    }
    if (
      updateTaskInput.priority &&
      updateTaskInput.priority !== task.priority
    ) {
      changes.priority = { from: task.priority, to: updateTaskInput.priority };
    }
    if (updateTaskInput.userId && updateTaskInput.userId !== task.userId) {
      changes.userId = { from: task.userId, to: updateTaskInput.userId };
    }

    if (Object.keys(changes).length > 0) {
      await this.activityLog.log('UPDATE', 'TASK', updatedTask.id, userId, {
        projectId: updatedTask.projectId,
        workspaceId: updatedTask.project.workspaceId,
        details: changes,
      });
    }

    return updatedTask;
  }

  async remove(id: number, userId: number) {
    const task = await this.findOne(id, userId);

    // Only OWNER or ADMIN can delete tasks
    await this.projectMemberService.checkPermission(userId, task.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const deletedTask = await this.prisma.task.delete({
      where: { id },
      include: {
        project: true,
      },
    });

    await this.activityLog.log('DELETE', 'TASK', id, userId, {
      projectId: deletedTask.projectId,
      workspaceId: deletedTask.project.workspaceId,
      details: { title: deletedTask.title },
    });

    return deletedTask;
  }
}
