import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserModel } from './user.model';

@Resolver(() => UserModel)
export class UserResolver {
    constructor(private userService: UserService) { }

    @Query(() => [UserModel])
    users() {
        return this.userService.findAll();
    }

    @Mutation(() => UserModel)
    createUser(@Args("name") name: string, @Args("email") email: string) {
        return this.userService.create(name, email)
    }

    @Mutation(() => UserModel)
    updateUser(@Args("id", { type: () => Int }) id: number, @Args("name") name: string, @Args("email") email: string) {
        return this.userService.update(id, name, email)
    }

    @Mutation(() => UserModel)
    deleteUser(@Args("id", { type: () => Int }) id: number) {
        return this.userService.delete(id)
    }
}
