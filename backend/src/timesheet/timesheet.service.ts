import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTimesheetInput } from './dto/create-timesheet.input';
import { UpdateTimesheetInput } from './dto/update-timesheet.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { ActivityLogService } from 'src/activity-log/activity-log.service';

@Injectable()
export class TimesheetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMemberService: ProjectMemberService,
    private readonly activityLog: ActivityLogService,
  ) {}

  get includeRelation() {
    return { user: true, project: true, task: true, approvedBy: true };
  }

  async create(createTimesheetInput: CreateTimesheetInput, userId: number) {
    // Verify user has access to the project
    await this.projectMemberService.checkPermission(
      userId,
      createTimesheetInput.projectId,
      [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER],
    );

    const cost = createTimesheetInput.hourlyRate
      ? createTimesheetInput.hourlyRate * createTimesheetInput.timeSpent
      : undefined;

    const timesheet = await this.prisma.timesheet.create({
      data: { ...createTimesheetInput, cost },
      include: { ...this.includeRelation },
    });

    await this.activityLog.log('CREATE', 'TIMESHEET', timesheet.id, userId, {
      projectId: timesheet.projectId,
      workspaceId: timesheet.project.workspaceId,
      details: {
        timeSpent: timesheet.timeSpent,
        description: timesheet.description,
      },
    });

    return timesheet;
  }

  async findAll(userId: number, skip?: number, take?: number, taskId?: number) {
    let projectIds: number[] = [];

    // Always filter by accessible projects
    const memberships = await this.projectMemberService.getUserProjects(userId);
    projectIds = memberships.map((m) => m.projectId);

    return this.prisma.timesheet.findMany({
      skip,
      take,
      where: {
        AND: [
          taskId ? { taskId } : {},
          { projectId: { in: projectIds } },
          { deletedAt: null },
        ],
      },
      include: { ...this.includeRelation },
    });
  }

  async findOne(id: number, userId: number) {
    const timesheet = await this.prisma.timesheet.findFirst({
      where: { id, deletedAt: null },
      include: { ...this.includeRelation },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Verify user has access to the project
    await this.projectMemberService.checkAccess(userId, timesheet.projectId);

    return timesheet;
  }

  async update(
    id: number,
    updateTimesheetInput: UpdateTimesheetInput,
    userId: number,
  ) {
    const timesheet = await this.findOne(id, userId);

    // Any MEMBER of the project can update timesheets (or we could limit to the creator)
    await this.projectMemberService.checkPermission(
      userId,
      timesheet.projectId,
      [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER],
    );

    let cost = updateTimesheetInput.cost;
    if (
      !cost &&
      (updateTimesheetInput.hourlyRate || updateTimesheetInput.timeSpent)
    ) {
      const rate = updateTimesheetInput.hourlyRate || timesheet.hourlyRate;
      const hours = updateTimesheetInput.timeSpent || timesheet.timeSpent;
      if (rate && hours) {
        cost = Number(rate) * hours;
      }
    }

    const updatedTimesheet = await this.prisma.timesheet.update({
      where: { id },
      data: { ...updateTimesheetInput, cost },
      include: { ...this.includeRelation },
    });

    const changes: any = {};
    if (
      updateTimesheetInput.timeSpent &&
      updateTimesheetInput.timeSpent !== timesheet.timeSpent
    ) {
      changes.timeSpent = {
        from: timesheet.timeSpent,
        to: updateTimesheetInput.timeSpent,
      };
    }
    if (
      updateTimesheetInput.description &&
      updateTimesheetInput.description !== timesheet.description
    ) {
      changes.description = {
        from: timesheet.description,
        to: updateTimesheetInput.description,
      };
    }

    if (Object.keys(changes).length > 0) {
      await this.activityLog.log('UPDATE', 'TIMESHEET', id, userId, {
        projectId: updatedTimesheet.projectId,
        workspaceId: updatedTimesheet.project.workspaceId,
        details: changes,
      });
    }

    return updatedTimesheet;
  }

  async remove(id: number, userId: number) {
    const timesheet = await this.findOne(id, userId);

    // Only OWNER or ADMIN can delete timesheets (or the creator, but let's stick to project roles)
    await this.projectMemberService.checkPermission(
      userId,
      timesheet.projectId,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    const updated = await this.prisma.timesheet.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        project: true,
      },
    });

    await this.activityLog.log('DELETE', 'TIMESHEET', id, userId, {
      projectId: updated.projectId,
      workspaceId: updated.project.workspaceId,
      details: { description: updated.description },
    });

    return updated;
  }
}
