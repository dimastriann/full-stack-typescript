import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: number, workspaceId?: number) {
    // If workspaceId is provided, we filter everything by it
    const whereWorkspace = workspaceId ? { workspaceId } : {};

    // Total users in the system or members of the workspace
    const totalUsers = workspaceId
      ? await this.prisma.workspaceMember.count({ where: { workspaceId } })
      : await this.prisma.user.count();

    const activeProjects = await this.prisma.project.count({
      where: {
        ...whereWorkspace,
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
        project: workspaceId ? { workspaceId } : undefined,
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
