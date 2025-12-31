import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';

import { ProjectMemberModule } from 'src/project-member/project-member.module';

@Module({
  imports: [ProjectMemberModule],
  providers: [CommentResolver, CommentService],
})
export class CommentModule { }
