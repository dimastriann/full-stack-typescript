import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';
import { createWriteStream, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { FileUpload } from 'graphql-upload-ts';

@Injectable()
export class AttachmentService {
    constructor(
        private prisma: PrismaService,
        private projectMemberService: ProjectMemberService,
    ) { }

    async uploadFile(file: FileUpload, relationId: number, relationType: 'project' | 'task' | 'comment', userId: number) {
        // 1. Determine Project ID for access check
        let projectId = 0;

        if (relationType === 'project') {
            projectId = relationId;
        } else if (relationType === 'task') {
            const task = await this.prisma.task.findUnique({
                where: { id: relationId },
                select: { projectId: true }
            });
            if (!task) throw new ForbiddenException('Task not found');
            projectId = task.projectId;
        } else if (relationType === 'comment') {
            const comment = await this.prisma.comment.findUnique({
                where: { id: relationId },
                select: { projectId: true }
            });
            if (!comment || !comment.projectId) throw new ForbiddenException('Comment or associated project not found');
            projectId = comment.projectId;
        }

        // 2. Verify user has access to the project
        await this.projectMemberService.checkPermission(userId, projectId, [
            ProjectRole.OWNER,
            ProjectRole.ADMIN,
            ProjectRole.MEMBER,
        ]);

        // 3. Proceed with upload
        const { createReadStream, filename, mimetype } = file;

        const uploadDir = join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueFragment = randomBytes(16).toString('hex');
        const uniqueFilename = `${Date.now()}-${uniqueFragment}-${filename}`;
        const filePath = join(uploadDir, uniqueFilename);
        const relativePath = `/uploads/${uniqueFilename}`;

        return new Promise((resolve, reject) => {
            createReadStream()
                .pipe(createWriteStream(filePath))
                .on('finish', async () => {
                    const stats = statSync(filePath);

                    const data: any = {
                        filename,
                        path: relativePath,
                        mimeType: mimetype,
                        size: stats.size,
                    };

                    if (relationType === 'project') data.projectId = relationId;
                    else if (relationType === 'task') data.taskId = relationId;
                    else if (relationType === 'comment') data.commentId = relationId;

                    const attachment = await this.prisma.attachment.create({
                        data,
                    });
                    resolve(attachment);
                })
                .on('error', (error: any) => reject(error));
        });
    }
}
