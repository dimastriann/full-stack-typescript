import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  get includesRelation() {
    return { projects: true, tasks: true, timesheets: true };
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.user.findMany({
      skip,
      take,
      include: { ...this.includesRelation, comments: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { ...this.includesRelation, comments: true },
    });
  }

  async create(createUserInput: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        ...createUserInput,
        password: await this.hashPassword(createUserInput.password || ''),
      },
      include: { ...this.includesRelation },
    });
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    if (updateUserInput.password) {
      updateUserInput.password = await this.hashPassword(
        updateUserInput.password,
      );
    }
    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
      include: { ...this.includesRelation },
    });
  }

  async delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
