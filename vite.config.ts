import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [
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
        start_url: "/",
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
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/websites/gym"),
            handler: "NetworkFirst",
            options: {
              cacheName: "gym-api",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
});
