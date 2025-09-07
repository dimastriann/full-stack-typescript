import { Injectable } from '@nestjs/common';
import { CreateTimesheetInput } from './dto/create-timesheet.input';
import { UpdateTimesheetInput } from './dto/update-timesheet.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TimesheetService {
  constructor(private readonly prisma: PrismaService) {}

  get includeRelation() {
    return { user: true, project: true, task: true };
  }

  create(createTimesheetInput: CreateTimesheetInput) {
    return this.prisma.timesheet.create({
      data: createTimesheetInput,
      include: { ...this.includeRelation },
    });
  }

  findAll() {
    return this.prisma.timesheet.findMany({
      include: { ...this.includeRelation },
    });
  }

  findOne(id: number) {
    return this.prisma.timesheet.findUnique({
      where: { id },
      include: { ...this.includeRelation },
    });
  }

  update(id: number, updateTimesheetInput: UpdateTimesheetInput) {
    return this.prisma.timesheet.update({
      where: { id },
      data: updateTimesheetInput,
      include: { ...this.includeRelation },
    });
  }

  remove(id: number) {
    return this.prisma.timesheet.delete({
      where: { id },
    });
  }
}
