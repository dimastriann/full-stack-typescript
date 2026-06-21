import { Module } from '@nestjs/common';
import { Request, Response } from 'express';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { BaseModule } from './base/base.module';
import { TimesheetModule } from './timesheet/timesheet.module';
import { CommentModule } from './comment/comment.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AttachmentModule } from './attachment/attachment.module';
import { ProjectMemberModule } from './project-member/project-member.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { ProjectStageModule } from './project-stage/project-stage.module';
import { TaskStageModule } from './task-stage/task-stage.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { validate } from './config/env.validation';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { depthLimitRule } from './common/validation/depth-limit.validation';
import { SubscriptionModule } from './subscription/subscription.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { NotificationModule } from './notification/notification.module';
import { ActivityLogModule } from './activity-log/activity-log.module';

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req, res }: { req?: Request; res?: Response }) => ({
        req,
        res,
      }),
      subscriptions: {
        'graphql-ws': true,
      },
      validationRules: [depthLimitRule(5)],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    UserModule,
    ProjectModule,
    TaskModule,
    BaseModule,
    TimesheetModule,
    CommentModule,
    AuthModule,
    AttachmentModule,
    ProjectMemberModule,
    DashboardModule,
    WorkspaceModule,
    ProjectStageModule,
    TaskStageModule,
    ChatModule,
    HealthModule,
    SubscriptionModule,
    SuperadminModule,
    NotificationModule,
    ActivityLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
