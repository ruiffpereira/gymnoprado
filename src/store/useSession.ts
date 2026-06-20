import { create } from "zustand";
import { getToken, setToken, setOnAuthExpired } from "../api/client";
import type { GymProfile as Profile } from "../gen/types/GymProfile";

type Status = "loading" | "authed" | "guest";

interface SessionState {
  status: Status;
  profile: Profile | null;
  setAuthed: (profile: Profile) => void;
  setProfile: (profile: Profile) => void;
  setGuest: () => void;
  hasToken: () => boolean;
}

export const useSession = create<SessionState>((set) => {
  // Quando o refresh falha de vez, voltamos a "guest".
  setOnAuthExpired(() => set({ status: "guest", profile: null }));

  return {
    status: getToken() ? "loading" : "guest",
    profile: null,
    setAuthed: (profile) => set({ status: "authed", profile }),
    setProfile: (profile) => set({ profile }),
    setGuest: () => {
      setToken(null);
      set({ status: "guest", profile: null });
    },
    hasToken: () => !!getToken(),
  };
});
