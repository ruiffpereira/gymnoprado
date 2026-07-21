/* eslint-disable no-undef */
// Handlers de Web Push, importados no service worker gerado pelo Workbox
// (vite-plugin-pwa → workbox.importScripts). O payload vem do backend
// (`sendPushNotificationsToCustomer`): { title, body, tag }.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "GYMNOPRADO", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "GYMNOPRADO";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if ("navigate" in client) client.navigate(url);
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
        return undefined;
      }),
  );
});
