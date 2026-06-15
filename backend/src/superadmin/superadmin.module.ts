import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';
import { AnalyticsCronService } from './analytics-cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // provides AuthService for banUser → logoutAll
    ScheduleModule.forRoot(), // registers the @Cron decorator processor
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService, AnalyticsCronService, RolesGuard, Reflector],
})
export class SuperadminModule {}
