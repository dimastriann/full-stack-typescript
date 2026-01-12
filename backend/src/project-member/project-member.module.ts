import { Module } from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberResolver } from './project-member.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProjectMemberResolver, ProjectMemberService],
  exports: [ProjectMemberService], // Export so other modules can use it
})
export class ProjectMemberModule {}
