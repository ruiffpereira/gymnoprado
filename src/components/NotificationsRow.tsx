import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button, Badge } from "./ui";
import { useCms } from "../context/CmsContext";
import { toast } from "../lib/toast";
import { subscribeToPush } from "../lib/push";

/**
 * Linha de notificações no Perfil — o cliente ativa as notificações do browser
 * e o dispositivo fica subscrito a Web Push no backend
 * (/websites/notifications/push/subscribe). Reflete o estado da permissão
 * (Ativar / Ativadas / Bloqueadas).
 */
export function NotificationsRow() {
  const { t } = useCms();
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [perm, setPerm] = useState<NotificationPermission>(
    supported ? Notification.permission : "default",
  );

  // Se a permissão já está concedida, garante que o dispositivo está subscrito
  // no backend (best-effort — ex.: novo login, ou subscrição perdida).
  useEffect(() => {
    if (supported && perm === "granted") {
      subscribeToPush().catch(() => undefined);
    }
  }, [supported, perm]);

  if (!supported) return null;

  const enable = async () => {
    try {
      const res = await Notification.requestPermission();
      setPerm(res);
      if (res === "granted") {
        // Subscreve o dispositivo a Web Push no backend.
        await subscribeToPush().catch(() => undefined);
        toast.success(t("gym.app.profile.notif_on"));
      } else if (res === "denied") {
        toast.error(t("gym.app.profile.notif_blocked"));
      }
    } catch {
      toast.error(t("gym.app.common.error"));
    }
  };

  const subtitle =
    perm === "granted"
      ? t("gym.app.profile.notif_on")
      : perm === "denied"
        ? t("gym.app.profile.notif_blocked")
        : t("gym.app.profile.notif_desc");

  return (
    <div className="w-full flex items-center gap-3 px-3 py-3 rounded-xl">
      {perm === "denied" ? <BellOff size={18} className="text-t3" /> : <Bell size={18} className="text-t2" />}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-t1">{t("gym.app.profile.notifications")}</span>
        <span className="block text-[12px] text-t3">{subtitle}</span>
      </div>
      {perm === "default" && (
        <Button size="sm" onClick={enable}>{t("gym.app.profile.notif_activate")}</Button>
      )}
      {perm === "granted" && (
        <Badge><Check size={12} /> {t("gym.app.profile.notif_active_badge")}</Badge>
      )}
    </div>
  );
}
