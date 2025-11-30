import { Injectable } from '@nestjs/common';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  get includeRelation() {
    return { responsible: true, tasks: true, timesheets: true };
  }

  create(createProjectInput: CreateProjectInput) {
    return this.prisma.project.create({
      data: createProjectInput,
      include: { ...this.includeRelation },
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.project.findMany({
      skip,
      take,
      include: {
        ...this.includeRelation,
        comments: { include: { user: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { ...this.includeRelation, comments: true },
    });
  }

  update(id: number, updateProjectInput: UpdateProjectInput) {
    return this.prisma.project.update({
      where: { id },
      data: { ...updateProjectInput },
      include: { ...this.includeRelation },
    });
  }

  delete(id: number) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
