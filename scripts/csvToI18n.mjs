#!/usr/bin/env node
/**
 * Converte content-import.csv em bundles i18n (JSON por locale).
 * Lê apenas as linhas com contexto gym.app.* e agrupa por locale.
 *
 * Uso: node scripts/csvToI18n.mjs
 *
 * Gera:
 *   - src/i18n/pt.json
 *   - src/i18n/en.json
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const csvFile = path.join(projectRoot, "content-import.csv");
const i18nDir = path.join(projectRoot, "src", "i18n");

async function main() {
  console.log(`[csvToI18n] Lendo ${csvFile}...`);
  const content = await fs.readFile(csvFile, "utf-8");
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l);

  if (lines.length === 0) {
    throw new Error("CSV vazio");
  }

  // Parse cabeçalho
  const headers = lines[0].split(",").map((h) => h.trim());
  const keyIdx = headers.indexOf("key");
  const localeIdx = headers.indexOf("locale");
  const valueIdx = headers.indexOf("value");

  if (keyIdx === -1 || localeIdx === -1 || valueIdx === -1) {
    throw new Error(
      `Cabeçalho inválido. Esperado: key, locale, value. Encontrado: ${headers.join(
        ", ",
      )}`,
    );
  }

  // Acumula por locale
  const bundles = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const key = (cols[keyIdx] ?? "").trim();
    const locale = (cols[localeIdx] ?? "").trim();
    const value = (cols[valueIdx] ?? "").trim();

    // Só aceita chaves gym.app.*
    if (!key.startsWith("gym.app.")) continue;
    if (!value) continue; // Ignora linhas sem valor

    if (!bundles[locale]) bundles[locale] = {};
    bundles[locale][key] = value;
  }

  // Escreve os JSONs
  if (!bundles.pt && !bundles.en) {
    throw new Error("Nenhuma chave gym.app.* encontrada no CSV");
  }

  await fs.mkdir(i18nDir, { recursive: true });

  for (const [locale, entries] of Object.entries(bundles)) {
    const filePath = path.join(i18nDir, `${locale}.json`);
    await fs.writeFile(filePath, JSON.stringify(entries, null, 2) + "\n");
    const count = Object.keys(entries).length;
    console.log(`[csvToI18n] ${filePath} (${count} chaves)`);
  }

  console.log("[csvToI18n] Pronto!");
}

main().catch((err) => {
  console.error("[csvToI18n] Erro:", err.message);
  process.exit(1);
});
