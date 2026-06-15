import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';
import { PwaController } from './pwa.controller';
import { BackupService } from './backup.service';
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
  controllers: [SuperadminController, PwaController],
  providers: [
    SuperadminService,
    AnalyticsCronService,
    RolesGuard,
    Reflector,
    BackupService,
  ],
})
export class SuperadminModule {}
