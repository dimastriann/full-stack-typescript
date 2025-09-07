import { Injectable } from '@nestjs/common';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTaskInput: CreateTaskInput) {
    return this.prisma.task.create({
      data: createTaskInput,
      include: { user: true, project: true },
    });
  }

  findAll() {
    return this.prisma.task.findMany({
      include: { user: true, project: true, comments: true },
    });
  }

  findOne(id: number) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { user: true, project: true, comments: true },
    });
  }

  update(id: number, updateTaskInput: UpdateTaskInput) {
    return this.prisma.task.update({
      where: { id },
      data: updateTaskInput,
      include: { user: true, project: true },
    });
  }

  remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }
}
