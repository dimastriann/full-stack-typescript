import { Injectable } from '@nestjs/common';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectService {

    constructor(private prisma: PrismaService){}

  create(createProjectInput: CreateProjectInput) {
    return this.prisma.project.create({data: createProjectInput});
  }

  async findAll() {
    return this.prisma.project.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectInput: UpdateProjectInput) {
    return this.prisma.project.update({
      where: {id},
      data: {...updateProjectInput}
    })
  }

  delete(id: number) {
    return this.prisma.project.delete({
            where: { id }
        })
  }
}
