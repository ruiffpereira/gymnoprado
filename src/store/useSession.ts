import { create } from "zustand";
import { setToken, setOnAuthExpired, setOnMembershipBlocked } from "../api/client";
import { purgeUserData } from "../lib/purge";
import type { GymProfile as Profile } from "../gen/types/GymProfile";

type Status = "loading" | "authed" | "guest";

interface SessionState {
  status: Status;
  profile: Profile | null;
  /** Sem rede ao abrir a app: perfil e dados vêm da cache do service worker e ainda não há token de acesso. */
  offline: boolean;
  /** GY-26: a API respondeu 403 MEMBERSHIP_BLOCKED. A sessão continua; a app mostra só o aviso e a mensalidade. */
  membershipBlocked: boolean;
  setMembershipBlocked: (blocked: boolean) => void;
  setAuthed: (profile: Profile, offline?: boolean) => void;
  setProfile: (profile: Profile) => void;
  setOffline: (offline: boolean) => void;
  setGuest: () => void;
}

export const useSession = create<SessionState>((set) => {
  // Quando o refresh falha de vez, voltamos a "guest".
  setOnAuthExpired(() => {
    set({ status: "guest", profile: null, offline: false, membershipBlocked: false });
    void purgeUserData(); // sessão expirada: os dados do sócio não ficam no dispositivo
  });

  setOnMembershipBlocked(() => set({ membershipBlocked: true }));

  return {
    membershipBlocked: false,
    setMembershipBlocked: (membershipBlocked) => set({ membershipBlocked }),
    // Token só em memória: ao abrir a app há sempre uma tentativa de restauro pelo cookie.
    status: "loading",
    profile: null,
    offline: false,
    setAuthed: (profile, offline = false) => set({ status: "authed", profile, offline }),
    setProfile: (profile) => set({ profile }),
    setOffline: (offline) => set({ offline }),
    setGuest: () => {
      setToken(null);
      set({ status: "guest", profile: null, offline: false, membershipBlocked: false });
    },
  };
});
