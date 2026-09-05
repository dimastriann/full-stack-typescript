import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskStageInput } from './dto/create-task-stage.input';
import { UpdateTaskStageInput } from './dto/update-task-stage.input';

@Injectable()
export class TaskStageService {
  constructor(private prisma: PrismaService) {}

  private async assertWorkspaceAccess(
    workspaceId: number,
    userId: number,
    requireAdmin = false,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });

    const isAdmin = member?.role === 'OWNER' || member?.role === 'ADMIN';
    if (!member || (requireAdmin && !isAdmin)) {
      throw new ForbiddenException(
        requireAdmin
          ? 'Only workspace owners or admins can manage task stages'
          : 'You do not have access to this workspace',
      );
    }
  }

  private async getAuthorizedStage(
    id: number,
    userId: number,
    requireAdmin = false,
  ) {
    const stage = await this.prisma.taskStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException(`Task stage ${id} not found`);
    }

    await this.assertWorkspaceAccess(stage.workspaceId, userId, requireAdmin);
    return stage;
  }

  async create(createTaskStageInput: CreateTaskStageInput, userId: number) {
    await this.assertWorkspaceAccess(
      createTaskStageInput.workspaceId,
      userId,
      true,
    );
    return this.prisma.taskStage.create({
      data: createTaskStageInput,
    });
  }

  async findAll(workspaceId: number, userId: number) {
    await this.assertWorkspaceAccess(workspaceId, userId);
    return this.prisma.taskStage.findMany({
      where: { workspaceId },
      orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number, userId: number) {
    return this.getAuthorizedStage(id, userId);
  }

  async update(
    id: number,
    updateTaskStageInput: UpdateTaskStageInput,
    userId: number,
  ) {
    await this.getAuthorizedStage(id, userId, true);
    return this.prisma.taskStage.update({
      where: { id },
      data: {
        ...(updateTaskStageInput.title !== undefined && {
          title: updateTaskStageInput.title,
        }),
        ...(updateTaskStageInput.description !== undefined && {
          description: updateTaskStageInput.description,
        }),
        ...(updateTaskStageInput.color !== undefined && {
          color: updateTaskStageInput.color,
        }),
        ...(updateTaskStageInput.isCompleted !== undefined && {
          isCompleted: updateTaskStageInput.isCompleted,
        }),
        ...(updateTaskStageInput.isCanceled !== undefined && {
          isCanceled: updateTaskStageInput.isCanceled,
        }),
        ...(updateTaskStageInput.sequence !== undefined && {
          sequence: updateTaskStageInput.sequence,
        }),
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.getAuthorizedStage(id, userId, true);
    return this.prisma.taskStage.delete({
      where: { id },
    });
  }
}
