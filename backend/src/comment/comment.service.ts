import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectMemberService } from 'src/project-member/project-member.service';
import { ProjectRole } from 'prisma/generated/enums';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMemberService: ProjectMemberService,
  ) { }

  async create(createCommentInput: CreateCommentInput, userId: number) {
    let projectId = createCommentInput.projectId;

    if (!projectId && createCommentInput.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: createCommentInput.taskId },
        select: { projectId: true },
      });
      if (task) projectId = task.projectId;
    }

    if (!projectId) {
      throw new ForbiddenException('Could not determine project for comment');
    }

    // Verify user has access to the project
    await this.projectMemberService.checkPermission(userId, projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    return this.prisma.comment.create({
      data: {
        ...createCommentInput,
        userId,
      },
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  async findAll(userId: number) {
    // Return only comments from projects user has access to
    const memberships = await this.projectMemberService.getUserProjects(userId);
    const projectIds = memberships.map(m => m.projectId);

    return this.prisma.comment.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  async findOne(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { user: true, project: true, task: true, parent: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (!comment.projectId) {
      throw new ForbiddenException('Comment is not associated with a project');
    }

    // Verify user has access to the project
    await this.projectMemberService.checkAccess(userId, comment.projectId);

    return comment;
  }

  async update(id: number, updateCommentInput: UpdateCommentInput, userId: number) {
    const comment = await this.findOne(id, userId);

    if (!comment.projectId) {
      throw new ForbiddenException('Comment is not associated with a project');
    }

    // Any MEMBER of the project can update comments (or we could limit to creator)
    await this.projectMemberService.checkPermission(userId, comment.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ]);

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentInput,
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  async remove(id: number, userId: number) {
    const comment = await this.findOne(id, userId);

    if (!comment.projectId) {
      throw new ForbiddenException('Comment is not associated with a project');
    }

    // Only OWNER or ADMIN can delete comments (or the creator)
    await this.projectMemberService.checkPermission(userId, comment.projectId, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    return this.prisma.comment.delete({
      where: { id },
    });
  }

  async findByParentId(parentId: number, userId: number) {
    // This is used for tree structure, should also verify access
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentId },
      select: { projectId: true },
    });

    if (parentComment?.projectId) {
      await this.projectMemberService.checkAccess(userId, parentComment.projectId);
    }

    return this.prisma.comment.findMany({
      where: { parentId },
      include: { user: true, project: true, task: true, parent: true },
    });
  }
}
