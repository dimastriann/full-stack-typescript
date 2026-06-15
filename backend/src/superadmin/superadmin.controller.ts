import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Res,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { IsEnum, IsObject, IsBoolean, IsInt, Min } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SuperadminService } from './superadmin.service';
import { BackupService } from './backup.service';
import { JwtAuthRestGuard } from '../auth/guards/jwt-auth-rest.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UserRole,
  PlanLevel,
  PaymentProvider,
} from '../../prisma/generated/client';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class UpdateUserRoleBody {
  /** Must be one of the allowed non-superadmin roles */
  @IsEnum(UserRole)
  role: UserRole;
}

class OverridePlanBody {
  @IsEnum(PlanLevel)
  planLevel: PlanLevel;
}

class UpsertProviderConfigBody {
  /** Arbitrary key-value config (API keys, webhook secrets, etc.) */
  @IsObject()
  config: Record<string, unknown>;

  @IsBoolean()
  isDefault: boolean;

  @IsBoolean()
  isActive: boolean;
}

class UpdatePlanLimitsBody {
  /** -1 means unlimited */
  @IsInt()
  @Min(-1)
  maxProjects: number;

  @IsInt()
  @Min(-1)
  maxMembers: number;

  @IsInt()
  @Min(-1)
  maxStorageGb: number;
}

/**
 * All routes here are protected by:
 *   1. JwtAuthRestGuard — valid access token + live Redis session
 *   2. RolesGuard       — user.role must be SUPERADMIN
 *
 * The RolesGuard here operates in REST context (reads from req.user directly).
 */
@Controller('superadmin')
@UseGuards(JwtAuthRestGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@Roles(UserRole.SUPERADMIN)
export class SuperadminController {
  constructor(
    private readonly superadminService: SuperadminService,
    private readonly backupService: BackupService,
  ) {}

  // ── Analytics ────────────────────────────────────────────────────────────────

  /**
   * GET /superadmin/analytics
   * Returns the latest analytics snapshot + 30-point history for charts.
   */
  @Get('analytics')
  getDashboardAnalytics() {
    return this.superadminService.getDashboardAnalytics();
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  /**
   * GET /superadmin/users?skip=0&take=50&search=...
   */
  @Get('users')
  getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.superadminService.getUsers({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
    });
  }

  /**
   * PATCH /superadmin/users/:id/role
   * Body: { role: 'ADMIN' | 'MANAGER' | 'USER' }
   */
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body() body: UpdateUserRoleBody,
  ) {
    return this.superadminService.updateUserRole(userId, body.role);
  }

  /**
   * POST /superadmin/users/:id/ban
   */
  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  banUser(@Param('id', ParseIntPipe) userId: number) {
    return this.superadminService.banUser(userId);
  }

  // ── Workspaces ────────────────────────────────────────────────────────────────

  /**
   * GET /superadmin/workspaces?skip=0&take=50&search=...
   */
  @Get('workspaces')
  getWorkspaces(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.superadminService.getWorkspaces({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
    });
  }

  /**
   * PUT /superadmin/workspaces/:id/plan
   * Body: { planLevel: 'PRO' | 'ENTERPRISE' | 'CUSTOM' | 'FREE' }
   * Overrides a workspace's plan without a payment transaction (manual override).
   */
  @Put('workspaces/:id/plan')
  overrideWorkspacePlan(
    @Param('id', ParseIntPipe) workspaceId: number,
    @Body() body: OverridePlanBody,
  ) {
    return this.superadminService.overrideWorkspacePlan(
      workspaceId,
      body.planLevel,
    );
  }

  // ── Payment Provider Configuration ───────────────────────────────────────────

  /**
   * GET /superadmin/payment-providers
   * Returns all provider configurations (keys are stored in DB, masked on return).
   */
  @Get('payment-providers')
  getPaymentProviderConfigs() {
    return this.superadminService.getPaymentProviderConfigs();
  }

  /**
   * PUT /superadmin/payment-providers/:provider
   * Body: { config: {...}, isDefault: true, isActive: true }
   * Upserts the config for a provider and optionally sets it as default.
   */
  @Put('payment-providers/:provider')
  upsertPaymentProviderConfig(
    @Param('provider') provider: PaymentProvider,
    @Body() body: UpsertProviderConfigBody,
  ) {
    return this.superadminService.upsertPaymentProviderConfig(
      provider,
      body.config,
      body.isDefault,
      body.isActive,
    );
  }

  // ── Plan Limits ───────────────────────────────────────────────────────────────

  /**
   * GET /superadmin/plan-limits
   */
  @Get('plan-limits')
  getPlanFeatureLimits() {
    return this.superadminService.getPlanFeatureLimits();
  }

  /**
   * PUT /superadmin/plan-limits/:planLevel
   * Body: { maxProjects: 10, maxMembers: 5, maxStorageGb: 5 }
   */
  @Put('plan-limits/:planLevel')
  updatePlanFeatureLimit(
    @Param('planLevel') planLevel: PlanLevel,
    @Body() body: UpdatePlanLimitsBody,
  ) {
    return this.superadminService.updatePlanFeatureLimit(
      planLevel,
      body.maxProjects,
      body.maxMembers,
      body.maxStorageGb,
    );
  }

  // ─── App Settings ──────────────────────────────────────────────────────────

  @Get('settings')
  getAppSettings() {
    return this.superadminService.getAppSettings();
  }

  @Put('settings')
  updateAppSettings(@Body() settings: Record<string, string>) {
    return this.superadminService.updateAppSettings(settings);
  }

  @Post('settings/upload-pwa-icon')
  @UseInterceptors(FileInterceptor('file'))
  uploadPwaIcon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.superadminService.savePwaIcon(file);
  }

  // ─── Database Backups ──────────────────────────────────────────────────────

  @Get('backups')
  listBackups() {
    return this.backupService.listBackups();
  }

  @Post('backups/trigger')
  async triggerBackup() {
    const result = await this.backupService.createBackup(true);
    return {
      success: true,
      filename: result.filename,
      size: result.size,
    };
  }

  @Delete('backups/:filename')
  deleteBackup(@Param('filename') filename: string) {
    return this.backupService.deleteBackup(filename);
  }

  @Get('backups/download/:filename')
  downloadBackup(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = this.backupService.getBackupPath(filename);
      return res.download(filePath, filename);
    } catch {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Backup file not found' });
    }
  }
}
