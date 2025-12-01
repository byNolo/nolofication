// Service Worker for Web Push Notifications

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      data = {
        title: 'Notification',
        body: event.data.text()
      };
    }
  }
  
  const title = data.title || 'NoloFication';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-96x96.png',
    tag: data.type || 'notification',
    data: data,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  // Open the app
  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event);
});
