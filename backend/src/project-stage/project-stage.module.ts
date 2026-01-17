import { Module } from '@nestjs/common';
import { ProjectStageService } from './project-stage.service';
import { ProjectStageResolver } from './project-stage.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ProjectStageResolver, ProjectStageService],
    exports: [ProjectStageService],
})
export class ProjectStageModule { }
