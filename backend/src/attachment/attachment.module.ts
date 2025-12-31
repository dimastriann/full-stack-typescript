import { Module } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { AttachmentResolver } from './attachment.resolver';

import { ProjectMemberModule } from 'src/project-member/project-member.module';

@Module({
    imports: [ProjectMemberModule],
    providers: [AttachmentResolver, AttachmentService],
    exports: [AttachmentService],
})
export class AttachmentModule { }
