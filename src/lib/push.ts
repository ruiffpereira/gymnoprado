import { axiosInstance } from "@kubb/plugin-client/clients/axios";

/**
 * Web Push do cliente (PWA). Liga-se ao backend novo:
 *   GET  /websites/notifications/push/vapid-public-key
 *   POST /websites/notifications/push/subscribe   { endpoint, keys }
 *   POST /websites/notifications/push/unsubscribe { endpoint }
 *
 * Usa o axiosInstance partilhado (baseURL + Bearer + site token já configurados
 * em src/api/client.ts). O SW é o gerado pelo vite-plugin-pwa (com push-sw.js).
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Subscreve o dispositivo a Web Push e regista a subscrição no backend.
 * Idempotente (reaproveita a subscrição existente). Devolve true se ficou
 * subscrito. Requer permissão de notificações já concedida.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;

  const { data } = await axiosInstance.request<{ publicKey?: string }>({
    method: "get",
    url: "/websites/notifications/push/vapid-public-key",
  });
  const publicKey = data?.publicKey;
  if (!publicKey) return false; // Web Push não configurado no servidor (503/sem chave)

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // cast: o lib.dom estrito vê Uint8Array<ArrayBufferLike>, mas em runtime
      // é um applicationServerKey válido.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = sub.toJSON();
  await axiosInstance.request({
    method: "post",
    url: "/websites/notifications/push/subscribe",
    data: {
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    },
  });
  return true;
}

/** Remove a subscrição local e no backend (best-effort). */
export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await axiosInstance
    .request({
      method: "post",
      url: "/websites/notifications/push/unsubscribe",
      data: { endpoint: sub.endpoint },
    })
    .catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}
