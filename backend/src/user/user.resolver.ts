import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput, UserRole } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as bcrypt from 'bcrypt';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AuthService } from '../auth/auth.service';
import { LoginResponse } from '../auth/dto/login-response';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GqlContext } from '../auth/types/context.type';

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
  me(@Context() context: GqlContext) {
    return context.req.user;
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: GqlContext,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    const { accessToken, refreshToken, sessionId } =
      await this.authService.login(user);

    const isProduction = process.env.NODE_ENV === 'production';

    context.res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    context.res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/auth/refresh', // Only sent to the refresh endpoint
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: sessionId,
      user,
    };
  }

  @Mutation(() => LoginResponse)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registration attempts per minute
  async register(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context() context: GqlContext,
  ) {
    // Ensure role is always USER for public registration
    const inputWithUserRole = {
      ...createUserInput,
      role: UserRole.USER,
    };
    const user = await this.userService.create(inputWithUserRole);
    if (!user) {
      throw new Error('Registration failed');
    }
    const { accessToken, refreshToken, sessionId } =
      await this.authService.login(user);

    const isProduction = process.env.NODE_ENV === 'production';

    context.res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    context.res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: sessionId,
      user,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(@Context() context: GqlContext) {
    const user = context.req.user as unknown as {
      id: number;
      sessionId: string;
    };
    if (user?.id && user?.sessionId) {
      await this.authService.logout(user.id, user.sessionId);
    }
    context.res.clearCookie('access_token');
    context.res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return true;
  }
}
