import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceResolver } from './workspace.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [WorkspaceResolver, WorkspaceService],
    exports: [WorkspaceService],
})
export class WorkspaceModule { }
