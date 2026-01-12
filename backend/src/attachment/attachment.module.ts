import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentResolver } from './attachment.resolver';
import { AttachmentController } from './attachment.controller';
import { ProjectMemberModule } from 'src/project-member/project-member.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [ProjectMemberModule, PrismaModule],
    controllers: [AttachmentController],
    providers: [AttachmentResolver, AttachmentService],
    exports: [AttachmentService],
})
export class AttachmentModule { }
