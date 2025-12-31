import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTimesheetInput } from './dto/create-timesheet.input';
import { UpdateTimesheetInput } from './dto/update-timesheet.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

@Injectable()
export class TimesheetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMemberService: ProjectMemberService,
  ) { }

  get includeRelation() {
    return { user: true, project: true, task: true };
  }

  async create(createTimesheetInput: CreateTimesheetInput, userId: number) {
    // Verify user has access to the project
    await this.projectMemberService.checkPermission(userId, createTimesheetInput.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    return this.prisma.timesheet.create({
      data: createTimesheetInput,
      include: { ...this.includeRelation },
    });
  }

  async findAll(userId: number, skip?: number, take?: number, taskId?: number) {
    let projectIds: number[] = [];

    // Always filter by accessible projects
    const memberships = await this.projectMemberService.getUserProjects(userId);
    projectIds = memberships.map(m => m.projectId);

    return this.prisma.timesheet.findMany({
      skip,
      take,
      where: {
        AND: [
          taskId ? { taskId } : {},
          { projectId: { in: projectIds } }
        ]
      },
      include: { ...this.includeRelation },
    });
  }

  async findOne(id: number, userId: number) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: { ...this.includeRelation },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Verify user has access to the project
    await this.projectMemberService.checkAccess(userId, timesheet.projectId);

    return timesheet;
  }

  async update(id: number, updateTimesheetInput: UpdateTimesheetInput, userId: number) {
    const timesheet = await this.findOne(id, userId);

    // Any MEMBER of the project can update timesheets (or we could limit to the creator)
    await this.projectMemberService.checkPermission(userId, timesheet.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    return this.prisma.timesheet.update({
      where: { id },
      data: updateTimesheetInput,
      include: { ...this.includeRelation },
    });
  }

  async remove(id: number, userId: number) {
    const timesheet = await this.findOne(id, userId);

    // Only OWNER or ADMIN can delete timesheets (or the creator, but let's stick to project roles)
    await this.projectMemberService.checkPermission(userId, timesheet.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.timesheet.delete({
      where: { id },
    });
  }
}
