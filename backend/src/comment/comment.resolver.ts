import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) { }

  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentInput,
    @CurrentUser() user: any,
  ) {
    return this.commentService.create(createCommentInput, user.id);
  }

  @Query(() => [Comment], { name: 'comments' })
  @UseGuards(GqlAuthGuard)
  findAll(@CurrentUser() user: any) {
    return this.commentService.findAll(user.id);
  }

  @Query(() => Comment, { name: 'comment' })
  @UseGuards(GqlAuthGuard)
  findOne(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.commentService.findOne(id, user.id);
  }

  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  updateComment(
    @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
    @CurrentUser() user: any,
  ) {
    return this.commentService.update(
      updateCommentInput.id,
      updateCommentInput,
      user.id,
    );
  }

  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  removeComment(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: any,
  ) {
    return this.commentService.remove(id, user.id);
  }

  @ResolveField(() => [Comment], { nullable: 'items' })
  @UseGuards(GqlAuthGuard)
  replies(@Parent() comment: Comment, @CurrentUser() user: any) {
    const { id } = comment;
    return this.commentService.findByParentId(id, user.id);
  }

  @ResolveField(() => Comment, { nullable: true })
  @UseGuards(GqlAuthGuard)
  parent(@Parent() comment: Comment, @CurrentUser() user: any) {
    const { parentId } = comment;
    if (!parentId) return null;
    return this.commentService.findOne(parentId, user.id);
  }
}
