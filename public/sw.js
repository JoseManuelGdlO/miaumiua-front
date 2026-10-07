self.addEventListener("push", (event) => {
  let data = { title: "Miaumiau", body: "", url: "/" };
  try {
    if (event.data) {
      const text = event.data.text();
      const parsed = JSON.parse(text);
      if (parsed.title) data.title = parsed.title;
      if (parsed.body) data.body = parsed.body;
      if (parsed.url) data.url = parsed.url;
    }
  } catch {
    /* ignore malformed payload */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rel = event.notification.data?.url || "/";
  const targetUrl = new URL(rel, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          void client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
