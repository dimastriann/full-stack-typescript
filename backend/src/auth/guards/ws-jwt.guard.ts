import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken = this.extractTokenFromHeader(client);

      if (!authToken) {
        throw new UnauthorizedException();
      }

      const payload = await this.jwtService.verifyAsync(authToken, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });

      // Attach user information to the client
      client['user'] = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Check auth header in handshake
    const [type, token] =
      client.handshake.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') return token;

    // Alternatively check query params or cookies if needed
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) return queryToken;

    // Check cookies
    const cookie = client.handshake.headers.cookie;
    if (cookie) {
      const accessTokenMatch = cookie.match(/access_token=([^;]+)/);
      if (accessTokenMatch) return accessTokenMatch[1];
    }

    return undefined;
  }
}
