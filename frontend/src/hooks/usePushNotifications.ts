import { useState, useEffect, useCallback } from 'react';
import { useMutation, gql } from '@apollo/client';
import Logger from '../lib/logger';

const SUBSCRIBE_TO_PUSH = gql`
  mutation SubscribeToPushNotifications($subscription: PushSubscriptionInput!) {
    subscribeToPushNotifications(subscription: $subscription) {
      id
      endpoint
    }
  }
`;

// Helper to convert base64 url-safe string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [subscribeToPush] = useMutation(SUBSCRIBE_TO_PUSH);

  // Check support and load current permission/subscription
  const checkSubscription = useCallback(async () => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      Logger.error('Error checking push subscription:', err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported on this browser.');
    }

    setLoading(true);

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        throw new Error('Permission not granted for notifications.');
      }

      // 2. Fetch VAPID public key from backend
      // We use the generated key. Let's make sure it's correct.
      // Alternatively, we can fetch it dynamically.
      const vapidPublicKey =
        'BJC6CUJxPgOBDZozx55enxeK94i9BAnJrq87UcM_5h3k7NYtXlL5Xky_E-T-K6f4pi--Rc-9lFzaOhcIs4XufR8';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // 3. Register or get existing service worker registration
      const registration = await navigator.serviceWorker.ready;

      // 4. Subscribe with push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 5. Send subscription info to GraphQL backend
      const subJson = subscription.toJSON();

      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error(
          'Subscription structure returned from browser is incomplete.',
        );
      }

      await subscribeToPush({
        variables: {
          subscription: {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
        },
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      Logger.error(
        'Failed to subscribe user to push notifications:',
        err as Error,
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return;

    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        // Note: For simplicity, the backend deletes old subscriptions when we send them notifications and get 410 Gone,
        // or we could add a GraphQL mutation to unsubscribe if needed.
      }
    } catch (err) {
      Logger.error(
        'Failed to unsubscribe from push notifications:',
        err as Error,
      );
    } finally {
      setLoading(false);
    }
  };

  const [sendTestMutation] = useMutation(gql`
    mutation SendTestPushNotification($title: String!, $body: String!) {
      sendTestPushNotification(title: $title, body: $body)
    }
  `);

  const sendTestNotification = async () => {
    try {
      await sendTestMutation({
        variables: {
          title: 'ProjectFlow Test',
          body: 'This is a test push notification. It works perfectly!',
        },
      });
      return true;
    } catch (err) {
      Logger.error('Failed to send test push notification:', err as Error);
      throw err;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
