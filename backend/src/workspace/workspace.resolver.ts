import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceInput } from './dto/create-workspace.input';
import { UpdateWorkspaceInput } from './dto/update-workspace.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => Workspace)
export class WorkspaceResolver {
    constructor(private readonly workspaceService: WorkspaceService) { }

    @Mutation(() => Workspace)
    @UseGuards(GqlAuthGuard)
    createWorkspace(
        @Args('createWorkspaceInput') createWorkspaceInput: CreateWorkspaceInput,
        @CurrentUser() user: any,
    ) {
        return this.workspaceService.create(createWorkspaceInput, user.id);
    }

    @Query(() => [Workspace])
    @UseGuards(GqlAuthGuard)
    workspaces(@CurrentUser() user: any) {
        return this.workspaceService.findAll(user.id);
    }

    @Query(() => Workspace)
    @UseGuards(GqlAuthGuard)
    workspace(
        @Args('id', { type: () => Int }) id: number,
        @CurrentUser() user: any,
    ) {
        return this.workspaceService.findOne(id, user.id);
    }

    @Mutation(() => Workspace)
    @UseGuards(GqlAuthGuard)
    updateWorkspace(
        @Args('updateWorkspaceInput') updateWorkspaceInput: UpdateWorkspaceInput,
        @CurrentUser() user: any,
    ) {
        return this.workspaceService.update(
            updateWorkspaceInput.id,
            updateWorkspaceInput,
            user.id,
        );
    }

    @Mutation(() => Workspace)
    @UseGuards(GqlAuthGuard)
    removeWorkspace(
        @Args('id', { type: () => Int }) id: number,
        @CurrentUser() user: any,
    ) {
        return this.workspaceService.remove(id, user.id);
    }
}
