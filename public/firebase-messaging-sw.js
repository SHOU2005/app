// Firebase Cloud Messaging service worker — handles background push notifications.
// FCM SDK looks for this file at the root of the site.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyDA4N-yBgrNvPYXZP3MvbV81slAt3a5hCE",
  authDomain:        "relay-15824.firebaseapp.com",
  projectId:         "relay-15824",
  storageBucket:     "relay-15824.firebasestorage.app",
  messagingSenderId: "444335957190",
  appId:             "1:444335957190:web:92c5b2f5b30a7ce16de3c7",
});

const messaging = firebase.messaging();

// Background messages: FCM calls this when the app tab is closed / not focused.
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || 'Switch';
  const body  = notification.body  || '';
  const data  = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon:     '/icon-192.png',
    data,
    tag:      data.notification_id || data.request_id || 'switch-push',
    renotify: true,
    vibrate:  [200, 100, 200],
  });
});

// When user taps the notification:
//  1. Mark the DB row read (so the bell stops showing it) if we have an id.
//  2. Focus an existing tab and tell it to navigate to data.url.
//  3. If no tab is open, open one at data.url.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data           = event.notification.data || {};
  const url            = data.url || '/';
  const notificationId = data.notification_id;

  const target = notificationId
    ? `${url}${url.includes('?') ? '&' : '?'}notif=${encodeURIComponent(notificationId)}`
    : url;

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if (client.url.includes(self.location.origin)) {
        try {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url, notificationId });
        } catch (_) {}
        if ('focus' in client) return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(target);
  })());
});
