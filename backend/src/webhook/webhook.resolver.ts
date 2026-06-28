import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { WebhookService } from './webhook.service';
import { WebhookEndpoint, WebhookDeliveryLog } from './entities/webhook.entity';
import { CreateWebhookInput, UpdateWebhookInput } from './dto/webhook.input';

@Resolver(() => WebhookEndpoint)
@UseGuards(GqlAuthGuard)
export class WebhookResolver {
  constructor(private readonly webhookService: WebhookService) {}

  @Query(() => [WebhookEndpoint], { name: 'webhookEndpoints' })
  async getWebhookEndpoints(
    @CurrentUser() user: User,
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
  ) {
    return this.webhookService.findAll(user.id, workspaceId);
  }

  @Query(() => [WebhookDeliveryLog], { name: 'webhookDeliveryLogs' })
  async getWebhookDeliveryLogs(
    @CurrentUser() user: User,
    @Args('endpointId', { type: () => Int }) endpointId: number,
  ) {
    return this.webhookService.findLogs(user.id, endpointId);
  }

  @Mutation(() => WebhookEndpoint, { name: 'createWebhookEndpoint' })
  async createWebhookEndpoint(
    @CurrentUser() user: User,
    @Args('input') input: CreateWebhookInput,
  ) {
    return this.webhookService.create(user.id, input);
  }

  @Mutation(() => WebhookEndpoint, { name: 'updateWebhookEndpoint' })
  async updateWebhookEndpoint(
    @CurrentUser() user: User,
    @Args('input') input: UpdateWebhookInput,
  ) {
    return this.webhookService.update(user.id, input);
  }

  @Mutation(() => WebhookEndpoint, { name: 'deleteWebhookEndpoint' })
  async deleteWebhookEndpoint(
    @CurrentUser() user: User,
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.webhookService.delete(user.id, id);
  }

  @Mutation(() => WebhookDeliveryLog, { name: 'testWebhookEndpoint' })
  async testWebhookEndpoint(
    @CurrentUser() user: User,
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.webhookService.testEndpoint(user.id, id);
  }
}

@Resolver(() => WebhookDeliveryLog)
export class WebhookDeliveryLogResolver {
  @ResolveField(() => String, { name: 'payload' })
  resolvePayload(@Parent() log: WebhookDeliveryLog): string {
    if (!log.payload) return '{}';
    return typeof log.payload === 'string'
      ? log.payload
      : JSON.stringify(log.payload);
  }
}
