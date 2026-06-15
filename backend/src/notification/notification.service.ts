import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionInput } from './dto/push-subscription.input';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@app.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.logger.log(
        'VAPID details for Web Push notifications configured successfully.',
      );
    } else {
      this.logger.warn(
        'VAPID keys are missing. Push notifications will not be sent.',
      );
    }
  }

  /**
   * Saves or updates a user's browser push subscription.
   */
  async subscribe(userId: number, input: PushSubscriptionInput) {
    const { endpoint, keys } = input;

    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
      create: {
        userId,
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
    });
  }

  /**
   * Sends a push notification to all active subscriptions of a user.
   */
  async sendNotification(
    userId: number,
    payload: { title: string; body: string; icon?: string; url?: string },
  ) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`No push subscriptions found for user ID: ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/api/pwa/icon.png',
        data: {
          url: payload.url || '/',
        },
      },
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
      } catch (error) {
        this.logger.error(
          `Error sending push notification to user ${userId} subscription ${sub.endpoint}:`,
          error,
        );

        // Clean up subscription if it's expired or invalid (410 Gone / 404 Not Found)
        if (
          error &&
          typeof error === 'object' &&
          'statusCode' in error &&
          ((error as { statusCode?: number }).statusCode === 410 ||
            (error as { statusCode?: number }).statusCode === 404)
        ) {
          this.logger.log(`Removing expired subscription: ${sub.endpoint}`);
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    });

    await Promise.all(sendPromises);
  }
}
