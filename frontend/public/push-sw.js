// Custom push and notification handlers for the PWA Service Worker

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event had no data.');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push received:', payload);

    const title = payload.notification.title || 'ProjectFlow';
    const options = {
      body: payload.notification.body || '',
      icon: payload.notification.icon || '/api/pwa/icon.png',
      badge: '/badge.png', // Fallback badge if available
      data: {
        url: payload.notification.data?.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error processing push event data:', err);
    
    // Fallback if data is not JSON
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('ProjectFlow Notification', {
        body: text,
        icon: '/api/pwa/icon.png',
        data: { url: '/' }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, navigate it or focus it
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
