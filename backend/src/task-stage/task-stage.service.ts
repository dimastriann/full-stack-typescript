import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskStageInput } from './dto/create-task-stage.input';
import { UpdateTaskStageInput } from './dto/update-task-stage.input';

@Injectable()
export class TaskStageService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskStageInput: CreateTaskStageInput) {
    return this.prisma.taskStage.create({
      data: createTaskStageInput,
    });
  }

  async findAll(workspaceId: number) {
    return this.prisma.taskStage.findMany({
      where: { workspaceId },
      orderBy: [{ sequence: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.taskStage.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateTaskStageInput: UpdateTaskStageInput) {
    return this.prisma.taskStage.update({
      where: { id },
      data: updateTaskStageInput,
    });
  }

  async remove(id: number) {
    return this.prisma.taskStage.delete({
      where: { id },
    });
  }
}
