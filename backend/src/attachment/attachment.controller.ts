import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AttachmentService } from './attachment.service';
import { ProjectMemberService } from '../project-member/project-member.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthRestGuard } from '../auth/guards/jwt-auth-rest.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectRole } from 'prisma/generated/enums';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('attachment')
export class AttachmentController {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly prisma: PrismaService,
    private readonly projectMemberService: ProjectMemberService,
  ) {}

  @Get('file/:id')
  @UseGuards(JwtAuthRestGuard)
  async getFile(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    // 1. Find the attachment
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new ForbiddenException('Attachment not found');
    }

    // 2. Determine Access Check
    if (attachment.messageId || attachment.conversationId) {
      // For chat, we verify the user is a participant of the conversation
      let conversationId = attachment.conversationId;

      if (!conversationId && attachment.messageId) {
        const msg = await this.prisma.message.findUnique({
          where: { id: attachment.messageId },
          select: { conversationId: true },
        });
        if (msg) conversationId = msg.conversationId;
      }

      if (!conversationId) {
        throw new ForbiddenException('Associated conversation not found');
      }

      const participant = await this.prisma.conversationParticipant.findUnique({
        where: {
          userId_conversationId: {
            userId: user.id,
            conversationId,
          },
        },
      });

      if (!participant) {
        throw new ForbiddenException(
          'You are not a participant of this conversation',
        );
      }
    } else {
      // Original project/task logic
      let projectId = attachment.projectId;
      if (!projectId && attachment.taskId) {
        const task = await this.prisma.task.findUnique({
          where: { id: attachment.taskId },
          select: { projectId: true },
        });
        if (task) projectId = task.projectId;
      }

      if (!projectId) {
        throw new ForbiddenException('Associated project not found');
      }

      // 3. Verify user has access to the project
      await this.projectMemberService.checkPermission(user.id, projectId, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
      ]);
    }

    // 4. Serve the file
    const filePath = join(process.cwd(), attachment.path);
    if (!existsSync(filePath)) {
      throw new ForbiddenException('File not found on storage');
    }

    if (download === 'true') {
      res.download(filePath, attachment.filename);
    } else {
      res.sendFile(filePath);
    }
  }
}
