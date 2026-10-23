import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// Falha o build se faltar uma env obrigatória (sem default silencioso).
const requireBuildEnv = (): Plugin => ({
  name: "require-build-env",
  configResolved(config) {
    if (config.command !== "build") return;
    for (const k of ["VITE_API_BASE_URL", "VITE_USER_ID", "VITE_SITE_TOKEN"]) {
      if (!config.env[k]) throw new Error(`Env em falta no build: ${k}`);
    }
  },
});

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [
    requireBuildEnv(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable.png"],
      manifest: {
        name: "GYMNOPRADO",
        short_name: "Gymnoprado",
        description: "A tua jornada de treino começa aqui.",
        theme_color: "#0D0F12",
        background_color: "#0D0F12",
        display: "standalone",
        orientation: "portrait",
        scope: process.env.VITE_BASE_PATH ?? "/",
        start_url: process.env.VITE_BASE_PATH ?? "/",
        icons: [
          // uso geral (transparente)
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          // full-bleed para o ecrã principal Android (sem anel/cortes)
          { src: "icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        // Importa os handlers de Web Push (push + notificationclick) para dentro
        // do SW gerado. O ficheiro vive em public/push-sw.js.
        importScripts: ["push-sw.js"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/websites/gym"),
            handler: "NetworkFirst",
            options: {
              cacheName: "gym-api",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
});
