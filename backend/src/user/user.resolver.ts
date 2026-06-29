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
import {
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
} from '../auth/dto/two-factor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GqlContext } from '../auth/types/context.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/** Helper to set HTTP-only auth cookies on the GQL response. */
function setAuthCookies(
  res: GqlContext['res'],
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

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

  // ─── Login ─────────────────────────────────────────────────────────────────

  @Mutation(() => LoginResponse)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Context() context: GqlContext,
  ): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // If 2FA is enabled, issue a short-lived pre-auth token instead of a session.
    if (user.twoFactorEnabled) {
      const preAuthToken = this.authService.issuePreAuthToken(user);
      return { requiresTwoFactor: true, preAuthToken };
    }

    // Standard login — create a full session.
    const { accessToken, refreshToken, sessionId } =
      await this.authService.login(user);

    setAuthCookies(context.res, accessToken, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: user as unknown as User,
    };
  }

  // ─── Register ──────────────────────────────────────────────────────────────

  @Mutation(() => LoginResponse)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context() context: GqlContext,
  ): Promise<LoginResponse> {
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

    setAuthCookies(context.res, accessToken, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: user as unknown as User,
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

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

  // ─── 2FA — Complete login (validates TOTP after password check) ─────────────

  @Mutation(() => LoginResponse)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async completeTwoFactorLogin(
    @Args('preAuthToken') preAuthToken: string,
    @Args('token') token: string,
    @Context() context: GqlContext,
  ): Promise<LoginResponse> {
    const { accessToken, refreshToken, sessionId } =
      await this.authService.completeTwoFactorLogin(preAuthToken, token);

    setAuthCookies(context.res, accessToken, refreshToken);

    // Decode to get userId, then load the user for the response
    const decoded = this.authService.decodeToken(preAuthToken) as {
      sub: number;
    } | null;
    const user = decoded
      ? await this.userService.findOne(decoded.sub)
      : undefined;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      session_id: sessionId,
      // Prisma type is compatible at runtime; cast suppresses structural type mismatch
      user: (user ?? undefined) as unknown as User,
    };
  }

  // ─── 2FA — Setup (generates secret + QR code URL) ──────────────────────────

  @Mutation(() => TwoFactorSetupResponse)
  @UseGuards(GqlAuthGuard)
  async setupTwoFactor(
    @CurrentUser() user: User,
  ): Promise<TwoFactorSetupResponse> {
    return this.authService.setupTwoFactor(user.id);
  }

  // ─── 2FA — Verify code and enable ──────────────────────────────────────────

  @Mutation(() => TwoFactorEnableResponse)
  @UseGuards(GqlAuthGuard)
  async verifyAndEnableTwoFactor(
    @CurrentUser() user: User,
    @Args('token') token: string,
  ): Promise<TwoFactorEnableResponse> {
    return this.authService.verifyAndEnableTwoFactor(user.id, token);
  }

  // ─── 2FA — Disable ─────────────────────────────────────────────────────────

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async disableTwoFactor(
    @CurrentUser() user: User,
    @Args('token') token: string,
  ): Promise<boolean> {
    await this.authService.disableTwoFactor(user.id, token);
    return true;
  }
}
