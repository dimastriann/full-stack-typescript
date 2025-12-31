import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjectMemberModule } from 'src/project-member/project-member.module';

@Module({
  imports: [PrismaModule, ProjectMemberModule],
  providers: [ProjectResolver, ProjectService],
})
export class ProjectModule { }
