import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '../../prisma/generated/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: number) {
    const totalUsers = await this.prisma.user.count();

    const activeProjects = await this.prisma.project.count({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    const pendingTasks = await this.prisma.task.count({
      where: {
        userId: userId,
        status: {
          not: TaskStatus.DONE,
        },
      },
    });

    return {
      totalUsers,
      activeProjects,
      pendingTasks,
    };
  }
}
