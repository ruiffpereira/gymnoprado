import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "./store/useSession";
import { fetchProfile } from "./api/session";
import { isAuthApiError, isNetworkApiError, isTransientApiError, refreshSession } from "./api/client";
import { queryClient } from "./lib/queryClient";
import { usePendingLogsSync } from "./hooks/usePendingLogsSync";
import { Layout } from "./components/Layout";
import { Toaster } from "./components/Toaster";
import { InstallPrompt } from "./components/InstallPrompt";
import { CookieConsent } from "./components/CookieConsent";
import { Spinner } from "./components/ui";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";
import { ForgotPassword } from "./screens/ForgotPassword";
import { ResetPassword } from "./screens/ResetPassword";
import { Dashboard } from "./screens/Dashboard";
import { Workouts } from "./screens/Workouts";
import { WorkoutDetail } from "./screens/WorkoutDetail";
import { WorkoutExec } from "./screens/WorkoutExec";
import { History } from "./screens/History";
import { Progress } from "./screens/Progress";
import { Profile } from "./screens/Profile";
import { CalendarSync } from "./screens/CalendarSync";
import { Privacy } from "./screens/Privacy";

/**
 * Restaura a sessão ao abrir/recarregar a app: o token de acesso vive só em memória,
 * por isso renova-se pelo cookie de refresh httpOnly e depois pede o perfil.
 *
 * A sessão só morre com 401/403 (sem cookie de refresh, ou cookie inválido/revogado). Apenas erros transitórios
 * (offline, 5xx, timeout) continuam a tentar com backoff — erros não-axios/4xx
 * falham de imediato. Isto impede retry infinito em erros definitivos (ex:
 * servidor recusando a conexão) e retém a sessão só enquanto houver esperança
 * de poder recuperá-la.
 */
function useRestoreSession() {
  const { status, setAuthed, setGuest } = useSession();
  const enabled = status === "loading";
  const { data, error, isError } = useQuery({
    queryKey: ["session-restore"],
    queryFn: async () => {
      try {
        await refreshSession();
      } catch (e) {
        // Sem rede (não 401): modo offline. O perfil e os dados vêm da cache `gym-api` do
        // service worker (NetworkFirst), sem token; quando a rede voltar, `useOfflineRecovery` renova.
        // Se não houver nada em cache, `fetchProfile` lança e o backoff abaixo continua a tentar.
        if (isNetworkApiError(e)) return { profile: await fetchProfile(), offline: true };
        throw e;
      }
      return { profile: await fetchProfile(), offline: false };
    },
    enabled,
    // Auth (401/403) → falha imediata (sem retries) e despromove.
    // Transitório (5xx, 429, 408, sem rede) → retry infinito com backoff.
    // Outro 4xx (400, 404, etc.) → falha imediata (não vai resolver sozinho).
    retry: (_failureCount, err) => {
      if (isAuthApiError(err)) return false;
      return isTransientApiError(err);
    },
    retryDelay: (attempt) => Math.min(30_000, 1000 * 2 ** attempt),
  });
  useEffect(() => {
    if (data) setAuthed(data.profile, data.offline);
  }, [data, setAuthed]);
  useEffect(() => {
    if (isError && isAuthApiError(error)) setGuest();
  }, [isError, error, setGuest]);
}

/**
 * Modo offline (abriu sem rede): quando a rede volta (evento `online`, app visível, ou de 20 em 20 s)
 * tenta renovar a sessão. Sucesso → token em memória, sai do modo offline e refresca tudo.
 * 401/403 → visitante. Qualquer outra falha → continua offline.
 */
function useOfflineRecovery() {
  const offline = useSession((s) => s.offline);
  const { setOffline, setGuest } = useSession();
  useEffect(() => {
    if (!offline) return;
    let busy = false;
    const tryRecover = async () => {
      if (busy) return;
      busy = true;
      try {
        await refreshSession();
        const profile = await fetchProfile();
        useSession.getState().setAuthed(profile, false);
        setOffline(false);
        void queryClient.invalidateQueries();
      } catch (e) {
        if (isAuthApiError(e)) setGuest();
      } finally {
        busy = false;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void tryRecover();
    };
    window.addEventListener("online", tryRecover);
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(() => void tryRecover(), 20_000);
    return () => {
      window.removeEventListener("online", tryRecover);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, [offline, setOffline, setGuest]);
}

export default function App() {
  useRestoreSession();
  useOfflineRecovery();
  // Drena a fila offline de logs (arranque + online + visível; só autenticado).
  usePendingLogsSync();
  const status = useSession((s) => s.status);
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-bg">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (status === "guest") {
    return (
      <>
        <Toaster />
        <InstallPrompt />
        <CookieConsent />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registo" element={<Register />} />
          <Route path="/recuperar" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <InstallPrompt />
      <CookieConsent />
      <Routes>
      {/* Execução em ecrã cheio (sem layout/nav) */}
      <Route path="/treino/:id/executar" element={<WorkoutExec />} />

      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/treinos" element={<Workouts />} />
              <Route path="/treino/:id" element={<WorkoutDetail />} />
              <Route path="/historico" element={<History />} />
              <Route path="/progresso" element={<Progress />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/calendario" element={<CalendarSync />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
      </Routes>
    </>
  );
}
