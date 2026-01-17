import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProjectStageService } from './project-stage.service';
import { ProjectStage } from './entities/project-stage.entity';
import { CreateProjectStageInput } from './dto/create-project-stage.input';
import { UpdateProjectStageInput } from './dto/update-project-stage.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';

@Resolver(() => ProjectStage)
@UseGuards(GqlAuthGuard)
export class ProjectStageResolver {
    constructor(private readonly projectStageService: ProjectStageService) { }

    @Mutation(() => ProjectStage)
    createProjectStage(
        @Args('createProjectStageInput') createProjectStageInput: CreateProjectStageInput,
    ) {
        return this.projectStageService.create(createProjectStageInput);
    }

    @Query(() => [ProjectStage], { name: 'projectStages' })
    findAll(@Args('workspaceId', { type: () => Int }) workspaceId: number) {
        return this.projectStageService.findAll(workspaceId);
    }

    @Query(() => ProjectStage, { name: 'projectStage' })
    findOne(@Args('id', { type: () => Int }) id: number) {
        return this.projectStageService.findOne(id);
    }

    @Mutation(() => ProjectStage)
    updateProjectStage(
        @Args('updateProjectStageInput') updateProjectStageInput: UpdateProjectStageInput,
    ) {
        return this.projectStageService.update(
            updateProjectStageInput.id,
            updateProjectStageInput,
        );
    }

    @Mutation(() => ProjectStage)
    removeProjectStage(@Args('id', { type: () => Int }) id: number) {
        return this.projectStageService.remove(id);
    }
}
