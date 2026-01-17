import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  get includesRelation() {
    return { projects: true, tasks: true, timesheets: true };
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.user.findMany({
      skip,
      take,
      include: { ...this.includesRelation, comments: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { ...this.includesRelation, comments: true },
    });
  }

  async create(createUserInput: CreateUserInput) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          ...createUserInput,
          password: await this.hashPassword(createUserInput.password || ''),
        },
      });

      // 2. Create the initial workspace
      const workspace = await tx.workspace.create({
        data: {
          name: `${user.firstName}'s Workspace`,
          description: 'Default personal workspace',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      // 3. Create default Project Stages
      await tx.projectStage.createMany({
        data: [
          { title: 'Active', color: '#3b82f6', workspaceId: workspace.id },
          { title: 'Archived', color: '#6b7280', workspaceId: workspace.id },
        ],
      });

      // 4. Create default Task Stages
      await tx.taskStage.createMany({
        data: [
          { title: 'To Do', color: '#6b7280', workspaceId: workspace.id },
          { title: 'In Progress', color: '#3b82f6', workspaceId: workspace.id },
          {
            title: 'Done',
            color: '#10b981',
            isCompleted: true,
            workspaceId: workspace.id,
          },
        ],
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: { ...this.includesRelation },
      });
    });
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    if (updateUserInput.password) {
      updateUserInput.password = await this.hashPassword(
        updateUserInput.password,
      );
    }
    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
      include: { ...this.includesRelation },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { ...this.includesRelation, comments: true },
    });
  }

  async delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
