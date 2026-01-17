import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectStageInput } from './dto/create-project-stage.input';
import { UpdateProjectStageInput } from './dto/update-project-stage.input';

@Injectable()
export class ProjectStageService {
    constructor(private prisma: PrismaService) { }

    async create(createProjectStageInput: CreateProjectStageInput) {
        return this.prisma.projectStage.create({
            data: createProjectStageInput,
        });
    }

    async findAll(workspaceId: number) {
        return this.prisma.projectStage.findMany({
            where: { workspaceId },
        });
    }

    async findOne(id: number) {
        return this.prisma.projectStage.findUnique({
            where: { id },
        });
    }

    async update(id: number, updateProjectStageInput: UpdateProjectStageInput) {
        return this.prisma.projectStage.update({
            where: { id },
            data: updateProjectStageInput,
        });
    }

    async remove(id: number) {
        return this.prisma.projectStage.delete({
            where: { id },
        });
    }
}
