import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../prisma/generated/client';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import {
  createWriteStream,
  mkdirSync,
  existsSync,
  statSync,
  unlinkSync,
} from 'fs';

import { join } from 'path';
import { randomBytes } from 'crypto';
import { FileUpload } from 'graphql-upload-ts';

@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    private prisma: PrismaService,
    private projectMemberService: ProjectMemberService,
  ) {}

  async uploadFile(
    file: FileUpload,
    relationId: number,
    relationType: 'project' | 'task' | 'comment' | 'message',
    userId: number,
  ) {
    this.logger.log(
      `Uploading file: relationType=${relationType}, relationId=${relationId}, userId=${userId}`,
    );
    let projectId = 0;
    const isChat = relationType === 'message';

    if (relationType === 'project') {
      projectId = relationId;
    } else if (relationType === 'task') {
      const task = await this.prisma.task.findUnique({
        where: { id: relationId },
        select: { projectId: true },
      });
      if (!task) throw new ForbiddenException('Task not found');
      projectId = task.projectId;
    } else if (relationType === 'comment') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: relationId },
        select: { projectId: true },
      });
      if (!comment || !comment.projectId)
        throw new ForbiddenException('Comment or associated project not found');
      projectId = comment.projectId;
    } else if (isChat) {
      // For chat, we verify the user is a participant of the conversation
      // We assume relationId is the conversationId for now, or we might need messageId
      // Actually, usually you upload an attachment BEFORE sending the message,
      // or as part of sending the message.
      // If relationType is 'message', relationId should be the conversationId
      // where the user wants to send the file.
      const participant = await this.prisma.conversationParticipant.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId: relationId,
          },
        },
      });
      if (!participant) {
        throw new ForbiddenException(
          'You are not a participant of this conversation',
        );
      }
    }

    // 2. Verify user has access to the project (only if not chat)
    if (!isChat) {
      await this.projectMemberService.checkPermission(userId, projectId, [
        ProjectRole.OWNER,
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
      ]);
    }

    // 3. Proceed with upload
    const filename = file.filename;
    const mimetype = file.mimetype;

    // Stage 1: Validation of filename extension & mimetype against malicious code/executable upload blocks
    const lowerFilename = filename.toLowerCase();
    const blockedExtensions = [
      '.html',
      '.htm',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.exe',
      '.bat',
      '.cmd',
      '.sh',
      '.php',
      '.pl',
      '.py',
      '.scr',
      '.vbs',
      '.msi',
      '.jsp',
      '.asp',
      '.aspx',
      '.jar',
    ];
    const blockedMimeTypes = [
      'text/html',
      'application/javascript',
      'application/x-javascript',
      'text/javascript',
      'application/x-msdownload',
      'application/x-sh',
      'application/x-bash',
      'application/x-php',
      'application/x-python',
      'application/x-httpd-php',
    ];

    const hasBlockedExt = blockedExtensions.some((ext) =>
      lowerFilename.endsWith(ext),
    );
    const hasBlockedMime = blockedMimeTypes.includes(mimetype.toLowerCase());

    if (hasBlockedExt || hasBlockedMime) {
      throw new ForbiddenException(
        `File upload blocked: File type not permitted for security reasons.`,
      );
    }

    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFragment = randomBytes(16).toString('hex');
    const uniqueFilename = `${Date.now()}-${uniqueFragment}-${filename}`;
    const filePath = join(uploadDir, uniqueFilename);
    const relativePath = `/uploads/${uniqueFilename}`;

    return new Promise((resolve, reject) => {
      file
        .createReadStream()
        .pipe(createWriteStream(filePath))
        .on('finish', () => {
          void (async () => {
            try {
              const stats = statSync(filePath);

              // Stage 2: Size validation (Max 10MB)
              const MAX_SIZE = 10 * 1024 * 1024; // 10MB
              if (stats.size > MAX_SIZE) {
                try {
                  unlinkSync(filePath);
                } catch {
                  // file already deleted or not writable
                }
                return reject(
                  new ForbiddenException(
                    'File exceeds the maximum limit of 10MB.',
                  ),
                );
              }

              const data: Prisma.AttachmentUncheckedCreateInput = {
                filename,
                path: relativePath,
                mimeType: mimetype,
                size: stats.size,
              };

              if (relationType === 'project') data.projectId = relationId;
              else if (relationType === 'task') data.taskId = relationId;
              else if (relationType === 'message')
                data.conversationId = relationId;

              const attachment = await this.prisma.attachment.create({
                data,
              });
              resolve(attachment);
            } catch (error) {
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          })();
        })
        .on('error', (error: unknown) =>
          reject(error instanceof Error ? error : new Error(String(error))),
        );
    });
  }

  async remove(id: number, userId: number) {
    // 1. Find the attachment
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new ForbiddenException('Attachment not found');
    }

    // 2. Determine Project ID for access check
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
    await this.projectMemberService.checkPermission(userId, projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    // 4. Delete the physical file
    const filePath = join(process.cwd(), attachment.path);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    // 5. Delete the database record
    return this.prisma.attachment.delete({
      where: { id },
    });
  }
}
