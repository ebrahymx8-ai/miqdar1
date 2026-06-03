self.addEventListener('push', function(event) {
  if (event.data) {
    let payload = {};
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'مقدار أعمال', body: event.data.text() };
    }
    
    const options = {
      body: payload.body || 'تنبيه جديد من مقدار أعمال 🥗',
      icon: '/logo.jpg',
      badge: '/logo.svg',
      vibrate: [100, 50, 100],
      data: {
        url: payload.url || '/business'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(payload.title || 'مقدار أعمال 🔔', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const targetUrl = event.notification.data ? event.notification.data.url : '/business';
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
