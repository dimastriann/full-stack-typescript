import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWebhookInput, UpdateWebhookInput } from './dto/webhook.input';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assertWorkspaceAdmin(workspaceId: number, userId: number) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException(
        'Only workspace owners or admins can manage webhooks',
      );
    }
  }

  async assertWorkspaceMember(workspaceId: number, userId: number) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
  }

  async create(userId: number, input: CreateWebhookInput) {
    await this.assertWorkspaceAdmin(input.workspaceId, userId);
    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    return this.prisma.webhookEndpoint.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        isActive: true,
      },
    });
  }

  async update(userId: number, input: UpdateWebhookInput) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: input.id },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook endpoint not found`);
    }

    await this.assertWorkspaceAdmin(webhook.workspaceId, userId);

    return this.prisma.webhookEndpoint.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.url && { url: input.url }),
        ...(input.events && { events: input.events }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }

  async delete(userId: number, id: number) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook endpoint not found`);
    }

    await this.assertWorkspaceAdmin(webhook.workspaceId, userId);

    return this.prisma.webhookEndpoint.delete({
      where: { id },
    });
  }

  async findAll(userId: number, workspaceId: number) {
    await this.assertWorkspaceMember(workspaceId, userId);

    return this.prisma.webhookEndpoint.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLogs(userId: number, endpointId: number) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook endpoint not found`);
    }

    await this.assertWorkspaceMember(webhook.workspaceId, userId);

    return this.prisma.webhookDeliveryLog.findMany({
      where: { webhookEndpointId: endpointId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Fires webhooks asynchronously (fire-and-forget in the background).
   */
  trigger(workspaceId: number, event: string, payload: any) {
    this.triggerAsync(workspaceId, event, payload).catch((err) => {
      this.logger.error(`Error triggering webhooks for event ${event}`, err);
    });
  }

  private async triggerAsync(workspaceId: number, event: string, payload: any) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { workspaceId, isActive: true, events: { has: event } },
    });

    if (endpoints.length === 0) return;

    this.logger.log(
      `Dispatching ${event} to ${endpoints.length} active webhooks`,
    );

    // Clean up payload fields if they are deep prisma objects
    const cleanPayload = this.sanitizePayload(payload);

    await Promise.all(
      endpoints.map((endpoint) =>
        this.dispatch(endpoint, event, cleanPayload).catch((err) => {
          this.logger.error(
            `Failed delivering ${event} to endpoint ${endpoint.id} (${endpoint.url})`,
            err,
          );
        }),
      ),
    );
  }

  async testEndpoint(userId: number, id: number) {
    const webhook = await this.prisma.webhookEndpoint.findUnique({
      where: { id },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook endpoint not found`);
    }

    await this.assertWorkspaceAdmin(webhook.workspaceId, userId);

    const testPayload = {
      event: 'test',
      ping: true,
      message: 'This is a test event from ProjectFlow.',
      timestamp: new Date().toISOString(),
    };

    return this.dispatch(webhook, 'test', testPayload);
  }

  private async dispatch(endpoint: any, event: string, payload: any) {
    const startTime = Date.now();

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(body)
      .digest('hex');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    let statusCode: number | null = null;
    let responseBody = '';
    let success = false;

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
        },
        body,
        signal: controller.signal,
      });

      statusCode = response.status;
      success = response.ok;
      responseBody = await response.text();
    } catch (err: any) {
      this.logger.warn(`Webhook endpoint delivery failed: ${err.message}`);
      responseBody = err.message || String(err);
      success = false;
    } finally {
      clearTimeout(timeoutId);
    }

    const durationMs = Date.now() - startTime;

    // Truncate response body if it's too long
    if (responseBody.length > 2000) {
      responseBody = responseBody.substring(0, 2000) + '... (truncated)';
    }

    return this.prisma.webhookDeliveryLog.create({
      data: {
        webhookEndpointId: endpoint.id,
        event,
        payload: payload as any,
        statusCode,
        responseBody,
        durationMs,
        success,
      },
    });
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return null;
    // Standard JS serialization/deserialization to strip complex references
    try {
      const stringified = JSON.stringify(payload, (key, value) => {
        // Exclude passwords or extremely large nested properties if present
        if (key === 'password' || key === 'twoFactorSecret') return undefined;
        return value;
      });
      return JSON.parse(stringified);
    } catch {
      return payload;
    }
  }
}
