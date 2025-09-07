import { Injectable } from '@nestjs/common';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCommentInput: CreateCommentInput) {
    return this.prisma.comment.create({
      data: createCommentInput,
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  findAll() {
    return this.prisma.comment.findMany({
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  findOne(id: number) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  update(id: number, updateCommentInput: UpdateCommentInput) {
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentInput,
      include: { user: true, project: true, task: true, parent: true },
    });
  }

  remove(id: number) {
    return this.prisma.comment.delete({
      where: { id },
    });
  }
}
