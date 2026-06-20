import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "./store/useSession";
import { fetchProfile } from "./api/session";
import { Layout } from "./components/Layout";
import { Toaster } from "./components/Toaster";
import { InstallPrompt } from "./components/InstallPrompt";
import { Spinner } from "./components/ui";
import { Login } from "./screens/Login";
import { Register } from "./screens/Register";
import { ForgotPassword } from "./screens/ForgotPassword";
import { ResetPassword } from "./screens/ResetPassword";
import { Dashboard } from "./screens/Dashboard";
import { Workouts } from "./screens/Workouts";
import { WorkoutDetail } from "./screens/WorkoutDetail";
import { WorkoutExec } from "./screens/WorkoutExec";
import { WorkoutEditor } from "./screens/WorkoutEditor";
import { History } from "./screens/History";
import { Progress } from "./screens/Progress";
import { Profile } from "./screens/Profile";

/** Tenta restaurar a sessão a partir do token guardado. */
function useRestoreSession() {
  const { status, hasToken, setAuthed, setGuest } = useSession();
  const enabled = status === "loading" && hasToken();
  const { data, isError } = useQuery({
    queryKey: ["me"],
    queryFn: fetchProfile,
    enabled,
    retry: false,
  });
  useEffect(() => {
    if (data) setAuthed(data);
  }, [data, setAuthed]);
  useEffect(() => {
    if (isError) setGuest();
  }, [isError, setGuest]);
}

export default function App() {
  useRestoreSession();
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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registo" element={<Register />} />
          <Route path="/recuperar" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <InstallPrompt />
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
              <Route path="/treino/:id/editar" element={<WorkoutEditor />} />
              <Route path="/programa/:programId/novo-treino" element={<WorkoutEditor />} />
              <Route path="/historico" element={<History />} />
              <Route path="/progresso" element={<Progress />} />
              <Route path="/perfil" element={<Profile />} />
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
