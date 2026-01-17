import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

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
        stage: {
          isCompleted: false,
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
