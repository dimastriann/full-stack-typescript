import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectStageInput } from './dto/create-project-stage.input';
import { UpdateProjectStageInput } from './dto/update-project-stage.input';

@Injectable()
export class ProjectStageService {
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
          ? 'Only workspace owners or admins can manage project stages'
          : 'You do not have access to this workspace',
      );
    }
  }

  private async getAuthorizedStage(
    id: number,
    userId: number,
    requireAdmin = false,
  ) {
    const stage = await this.prisma.projectStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException(`Project stage ${id} not found`);
    }

    await this.assertWorkspaceAccess(stage.workspaceId, userId, requireAdmin);
    return stage;
  }

  async create(
    createProjectStageInput: CreateProjectStageInput,
    userId: number,
  ) {
    await this.assertWorkspaceAccess(
      createProjectStageInput.workspaceId,
      userId,
      true,
    );
    return this.prisma.projectStage.create({
      data: createProjectStageInput,
    });
  }

  async findAll(workspaceId: number, userId: number) {
    await this.assertWorkspaceAccess(workspaceId, userId);
    return this.prisma.projectStage.findMany({
      where: { workspaceId },
      orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number, userId: number) {
    return this.getAuthorizedStage(id, userId);
  }

  async update(
    id: number,
    updateProjectStageInput: UpdateProjectStageInput,
    userId: number,
  ) {
    await this.getAuthorizedStage(id, userId, true);
    return this.prisma.projectStage.update({
      where: { id },
      data: {
        ...(updateProjectStageInput.title !== undefined && {
          title: updateProjectStageInput.title,
        }),
        ...(updateProjectStageInput.description !== undefined && {
          description: updateProjectStageInput.description,
        }),
        ...(updateProjectStageInput.color !== undefined && {
          color: updateProjectStageInput.color,
        }),
        ...(updateProjectStageInput.isCompleted !== undefined && {
          isCompleted: updateProjectStageInput.isCompleted,
        }),
        ...(updateProjectStageInput.isCanceled !== undefined && {
          isCanceled: updateProjectStageInput.isCanceled,
        }),
        ...(updateProjectStageInput.sequence !== undefined && {
          sequence: updateProjectStageInput.sequence,
        }),
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.getAuthorizedStage(id, userId, true);
    return this.prisma.projectStage.delete({
      where: { id },
    });
  }
}
