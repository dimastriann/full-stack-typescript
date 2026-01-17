import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceInput } from './dto/create-workspace.input';
import { UpdateWorkspaceInput } from './dto/update-workspace.input';
import { WorkspaceRole } from 'prisma/generated/enums';

@Injectable()
export class WorkspaceService {
    constructor(private prisma: PrismaService) { }

    get includeRelation() {
        return {
            members: {
                include: {
                    user: true,
                },
            },
            projects: true,
            projectStages: true,
            taskStages: true,
        };
    }

    async create(createWorkspaceInput: CreateWorkspaceInput, userId: number) {
        const workspace = await this.prisma.workspace.create({
            data: {
                ...createWorkspaceInput,
            },
            include: this.includeRelation,
        });

        // Add creator as OWNER
        await this.prisma.workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId: userId,
                role: WorkspaceRole.OWNER,
            },
        });

        return workspace;
    }

    async findAll(userId: number) {
        // Return workspaces where user is a member
        return this.prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: this.includeRelation,
        });
    }

    async findOne(id: number, userId: number) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id },
            include: this.includeRelation,
        });

        if (!workspace) return null;

        const isMember = workspace.members.some((m) => m.userId === userId);
        if (!isMember) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        return workspace;
    }

    async update(id: number, updateWorkspaceInput: UpdateWorkspaceInput, userId: number) {
        await this.checkPermission(id, userId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

        return this.prisma.workspace.update({
            where: { id },
            data: updateWorkspaceInput,
            include: this.includeRelation,
        });
    }

    async remove(id: number, userId: number) {
        await this.checkPermission(id, userId, [WorkspaceRole.OWNER]);

        return this.prisma.workspace.delete({
            where: { id },
        });
    }

    async checkPermission(workspaceId: number, userId: number, roles: WorkspaceRole[]) {
        const member = await this.prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },
            },
        });

        if (!member || !roles.includes(member.role)) {
            throw new ForbiddenException('You do not have permission to perform this action');
        }

        return member;
    }
}
