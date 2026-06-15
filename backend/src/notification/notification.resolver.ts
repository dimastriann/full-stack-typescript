import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';
import { PushSubscriptionInput } from './dto/push-subscription.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Mutation(() => PushSubscriptionEntity)
  @UseGuards(GqlAuthGuard)
  async subscribeToPushNotifications(
    @Args('subscription') subscription: PushSubscriptionInput,
    @CurrentUser() user: User,
  ) {
    return this.notificationService.subscribe(user.id, subscription);
  }

  // Helper mutation to send a test notification to the logged-in user
  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async sendTestPushNotification(
    @Args('title') title: string,
    @Args('body') body: string,
    @CurrentUser() user: User,
  ) {
    await this.notificationService.sendNotification(user.id, {
      title,
      body,
      url: '/',
    });
    return true;
  }
}
