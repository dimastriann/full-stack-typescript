import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthRestGuard } from './guards/jwt-auth-rest.guard';
import { Throttle } from '@nestjs/throttler';

interface AuthenticatedUser {
  id: number;
  email: string;
  sessionId: string;
}

/**
 * REST endpoints for token lifecycle management.
 * GraphQL handles login/register/logout mutations.
 * This controller handles the silent token refresh flow.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/refresh
   * Silently refreshes the access token using the httpOnly refresh_token cookie.
   * The old session is atomically rotated — replay attacks are prevented.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)[
      'refresh_token'
    ];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
    } = await this.authService.refresh(refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { ok: true, session_id: sessionId };
  }

  /**
   * POST /auth/logout-all
   * Destroys ALL sessions for the current user (sign out from every device).
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthRestGuard)
  async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as unknown as AuthenticatedUser;
    await this.authService.logoutAll(user.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { ok: true };
  }
}
