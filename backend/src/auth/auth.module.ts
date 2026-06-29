import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectMemberModule } from 'src/project-member/project-member.module';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectPermissionGuard } from './guards/project-permission.guard';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    ProjectMemberModule,
    RedisModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        // Default sign options — individual calls may override expiresIn
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ProjectAccessGuard,
    ProjectPermissionGuard,
  ],
  exports: [AuthService, ProjectAccessGuard, ProjectPermissionGuard],
})
export class AuthModule {}
