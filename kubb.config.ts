import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { existsSync, readFileSync } from "node:fs";

function readDotEnv(): Record<string, string> {
  if (!existsSync(".env")) return {};
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=").replace(/^["']|["']$/g, "")];
      }),
  );
}

const dotEnv = readDotEnv();
const API_BASE =
  process.env.VITE_API_BASE_URL ?? dotEnv.VITE_API_BASE_URL ?? "http://localhost:3001/api";

const sharedPlugins = [
  pluginOas(),
  pluginTs(),
  pluginReactQuery({
    client: { baseURL: API_BASE },
  }),
];

export default defineConfig([
  {
    root: ".",
    input: {
      path: `${API_BASE}-docs/websites/gym.json`,
    },
    output: {
      path: "./src/gen",
      extension: { ".ts": ".js" },
      clean: true,
    },
    plugins: sharedPlugins,
  },
  // CMS público (conteúdos + línguas) — endpoints partilhados dos websites.
  {
    root: ".",
    input: {
      path: `${API_BASE}-docs/websites/content.json`,
    },
    output: {
      path: "./src/gen-cms",
      extension: { ".ts": ".js" },
      clean: true,
    },
    plugins: sharedPlugins,
  },
]);
