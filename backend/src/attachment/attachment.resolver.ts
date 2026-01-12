import { Resolver, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { Attachment } from './entities/attachment.entity';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => Attachment)
export class AttachmentResolver {
    constructor(private readonly attachmentService: AttachmentService) { }

    @Mutation(() => Attachment)
    @UseGuards(GqlAuthGuard)
    async uploadFile(
        @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload,
        @Args('relationId', { type: () => Int }) relationId: number,
        @Args('relationType', { type: () => String }) relationType: 'project' | 'task' | 'comment',
        @CurrentUser() user: any,
    ) {
        return this.attachmentService.uploadFile(file, relationId, relationType, user.id);
    }

    @Mutation(() => Attachment)
    @UseGuards(GqlAuthGuard)
    async removeAttachment(
        @Args('id', { type: () => Int }) id: number,
        @CurrentUser() user: any,
    ) {
        return this.attachmentService.remove(id, user.id);
    }
}
