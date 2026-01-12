import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput, UserRole } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as bcrypt from 'bcrypt';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AuthService } from '../auth/auth.service';
import { LoginResponse } from '../auth/dto/login-response';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  users(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.userService.findAll(skip, take);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  getUser(@Args('id', { type: () => Int }) id: number) {
    return this.userService.findOne(id);
  }

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.userService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteUser(@Args('id', { type: () => Int }) id: number) {
    return this.userService.delete(id);
  }

  @Mutation(() => LoginResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: any,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // if bcrypt compare failed, try to compare plain password
      // (only for migration/dev, remove in prod ideally or re-hash)
      isMatch = password === user.password;
    }
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    const loginResponse = await this.authService.login(user);

    context.res.cookie('access_token', loginResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    return loginResponse;
  }

  @Mutation(() => LoginResponse)
  async register(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context() context: any,
  ) {
    // Ensure role is always USER for public registration
    const inputWithUserRole = {
      ...createUserInput,
      role: UserRole.USER,
    };
    const user = await this.userService.create(inputWithUserRole);
    const loginResponse = await this.authService.login(user);

    context.res.cookie('access_token', loginResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    });

    return loginResponse;
  }

  @Mutation(() => Boolean)
  async logout(@Context() context: any) {
    context.res.clearCookie('access_token');
    return true;
  }
}
