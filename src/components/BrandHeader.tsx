/**
 * Cabeçalho de branding para ecrãs pré-login.
 * Mostra o logo + nome do tenant, ou fallback para o logo padrão.
 */

import { tryGetAppConfig } from "../lib/appConfig";
import { Logo } from "./ui";

interface BrandHeaderProps {
  size?: "sm" | "md" | "lg";
}

export function BrandHeader({ size = "lg" }: BrandHeaderProps) {
  const appConfig = tryGetAppConfig();

  // Fallback: logo padrão (app não carregada ainda).
  if (!appConfig) {
    return <Logo size={size} />;
  }

  // Se há logo do tenant, mostra-o; senão mostra apenas o nome ou o logo padrão.
  const hasCustomLogo = appConfig.logoUrl && appConfig.logoUrl.trim() !== "";
  const tenantName = appConfig.name || "App";

  const sizeClass = {
    sm: { container: "gap-2", img: "h-7 w-7", text: "text-[15px]" },
    md: { container: "gap-2.5", img: "h-9 w-9", text: "text-[19px]" },
    lg: { container: "gap-3", img: "h-12 w-12", text: "text-[26px]" },
  }[size];

  return (
    <div className={`flex items-center ${sizeClass.container}`}>
      {hasCustomLogo && appConfig.logoUrl ? (
        <img
          src={appConfig.logoUrl}
          alt={tenantName}
          className={`${sizeClass.img} object-contain rounded`}
        />
      ) : (
        <Logo size={size} />
      )}
      {tenantName !== "GYMNOPRADO" && (
        <span className={`font-black tracking-[-0.03em] ${sizeClass.text} text-t1`}>
          {tenantName}
        </span>
      )}
    </div>
  );
}
