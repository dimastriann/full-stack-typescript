import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/** A single field-level change captured in an UPDATE log entry. */
export interface FieldChange {
  from: string | number | boolean | null;
  to: string | number | boolean | null;
}

/**
 * Flexible details payload stored per activity log entry.
 * For CREATE / DELETE: `{ title?: string; name?: string }`.
 * For UPDATE:          `{ [field]: { from, to } }`.
 * For member actions:  `{ inviteeEmail?, role?, targetUserName?, ... }`.
 */
export type ActivityLogDetails = Record<
  string,
  FieldChange | string | number | boolean | null | undefined
>;

export interface LogOptions {
  workspaceId?: number;
  projectId?: number;
  details?: ActivityLogDetails;
}

export interface FindAllOptions {
  workspaceId?: number;
  projectId?: number;
  entityType?: string;
  entityId?: number;
  skip?: number;
  take?: number;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a single activity log entry.
   * `details` is stored as JSON and serialized by Prisma automatically.
   */
  async log(
    action: string,
    entityType: string,
    entityId: number,
    userId: number,
    options?: LogOptions,
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        workspaceId: options?.workspaceId ?? null,
        projectId: options?.projectId ?? null,
        // Cast to `object` to satisfy Prisma's JSON field type
        details: (options?.details ?? null) as object,
      },
    });
  }

  /**
   * Return activity logs with access-control enforcement.
   * Callers must be a workspace or project member to read logs.
   */
  async findAll(userId: number, options: FindAllOptions) {
    const { workspaceId, projectId, entityType, entityId, skip, take } =
      options;

    if (workspaceId !== undefined) {
      const isMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      });
      if (!isMember) {
        throw new ForbiddenException(
          'You do not have access to this workspace',
        );
      }
    }

    if (projectId !== undefined) {
      const isMember = await this.prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });
      if (!isMember) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    return this.prisma.activityLog.findMany({
      where: {
        ...(workspaceId !== undefined && { workspaceId }),
        ...(projectId !== undefined && { projectId }),
        ...(entityType !== undefined && { entityType }),
        ...(entityId !== undefined && { entityId }),
      },
      skip,
      take: take ?? 50,
      orderBy: { createdAt: 'desc' },
      include: { user: true, project: true, workspace: true },
    });
  }
}
