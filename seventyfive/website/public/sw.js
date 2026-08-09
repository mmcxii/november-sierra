self.addEventListener("push", (event) => {
  let payload = { body: "", title: "Seventy Five" };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload.body = event.data ? event.data.text() : "";
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Seventy Five", {
      body: payload.body || "",
      data: { url: "/group" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/group";
  event.waitUntil(clients.openWindow(url));
});
