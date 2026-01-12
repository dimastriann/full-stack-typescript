import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectMemberModule } from 'src/project-member/project-member.module';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectPermissionGuard } from './guards/project-permission.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    ProjectMemberModule, // Import to use ProjectMemberService in guards
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    ProjectAccessGuard,
    ProjectPermissionGuard,
  ],
  exports: [AuthService, ProjectAccessGuard, ProjectPermissionGuard],
})
export class AuthModule {}
