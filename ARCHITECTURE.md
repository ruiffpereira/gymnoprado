# Arquitetura recomendada — GYMNOPRADO (PWA)

> Recomendação para implementar a app do cliente como PWA, assumindo que o **backoffice/API já existe**.

## Stack

| Camada | Escolha | Porquê |
|---|---|---|
| Build / framework | **React + Vite** | App stateful (não conteúdo); SSR desnecessário. Arranque rápido, HMR, bundle pequeno. |
| Linguagem | **TypeScript** | Modelos de treino/série beneficiam muito de tipos. |
| Routing | **React Router** | Rotas para os ecrãs; deep-link a treinos. |
| Estado servidor | **TanStack Query** | Cache, revalidação, retry e suporte offline dos dados da API. |
| Estado local UI | **Zustand** | Treino em execução, tema, sessão. Simples, sem boilerplate (evitar Redux). |
| PWA / offline | **vite-plugin-pwa** (Workbox) | Service worker, manifest, precache, update prompt. |
| Persistência offline | **Dexie (IndexedDB)** | Guardar treino em curso + fila de sync de logs. |
| Estilos | **Tailwind CSS** (ou CSS Modules) | Tokens abaixo mapeiam diretamente a `theme.extend`. |
| Ícones | **lucide-react** | Equivalente ao set do protótipo. |
| Datas | **date-fns** (locale `pt`) | Formatação "há 2 dias", semanas. |
| Lojas (futuro) | **Capacitor** | Embrulha a mesma PWA em iOS/Android sem reescrever. |

## Porque NÃO

- **Redux** — excesso de boilerplate para esta escala. Server-state vai para React Query; o resto é trivial em Zustand.
- **Next.js** — só compensa se quiseres também um **portal web do coach**, SEO ou API routes no mesmo repo. Para a app do cliente sobre API existente, traz peso (SSR/hidratação) sem ganho.
- **Astro** — ótimo para a *landing page* do ginásio, mau para uma app interativa e stateful como esta.
- **Vue/Nuxt** — válido, mas o protótipo é React e o ecossistema PWA/Query é mais maduro em React. Só se a equipa já dominar Vue.

## Estrutura de pastas sugerida

```
src/
  main.tsx
  App.tsx                      # providers (Query, Router, Theme) + rotas
  routes/
    Login.tsx
    Dashboard.tsx
    Workouts.tsx               # separadores Coach/Meus + grupos
    WorkoutDetail.tsx          # pré-visualização
    WorkoutExec.tsx            # execução + timer
    History.tsx
    Progress.tsx
    Profile.tsx
    WorkoutEditor.tsx          # criar/editar
  components/
    ui/                        # Button, Card, Input, Badge, Avatar, Modal, Tabs, ProgressRing, Stepper
    nav/                       # SideNav, BottomNav, Layout
    workout/                   # WorkoutCard, ExerciseRow, SetTracker, RestTimer, ExerciseMedia
    ThemeToggle.tsx
  store/
    useSession.ts              # user/login (Zustand)
    useTheme.ts                # tema persistido
    useActiveWorkout.ts        # sessão de treino em curso (séries, tempo, índice)
  api/
    client.ts                  # fetch/axios + auth
    workouts.ts                # queries/mutations de programas/treinos
    logs.ts                    # histórico + gravar log
    profile.ts
  hooks/
    useRestTimer.ts
    useElapsed.ts
  lib/
    theme.css                  # custom properties (tokens light/dark)
    exercises.ts               # EXERCISE_DB, GROUP_COLORS
    format.ts                  # datas, "há X dias"
    offline.ts                 # Dexie + fila de sync
  pwa/
    sw.ts (gerado)             # via vite-plugin-pwa
```

## Tokens → Tailwind (`tailwind.config`)

```js
theme: {
  extend: {
    colors: {
      brand: { DEFAULT: '#8DC63F', dk: '#6BA82E', lt: '#EBF6D3', xlt: '#F4FAE8' },
      // resto via CSS vars para suportar dark mode:
      bg: 'var(--bg)', surface: 'var(--surface)',
      t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', line: 'var(--border)',
      group: { peito:'#3B82F6', costas:'#8B5CF6', ombros:'#F59E0B', biceps:'#EC4899',
               triceps:'#EF4444', pernas:'#10B981', gluteos:'#F97316', abdomen:'#6B7280' },
    },
    fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
    borderRadius: { card: '20px', btn: '13px', pill: '100px' },
    boxShadow: {
      card: '0 2px 16px rgba(0,0,0,0.07)',
      md: '0 4px 24px rgba(0,0,0,0.10)',
      lg: '0 12px 48px rgba(0,0,0,0.16)',
    },
  },
}
```
`theme.css` define `--bg`, `--surface`, etc. em `:root` (claro) e `:root[data-theme="dark"]` (escuro) — ver valores em `README.md` → Design Tokens.

## Dark mode
- Guardar a preferência em `localStorage` (`gymnoprado_theme`) e aplicar `data-theme` em `<html>`.
- Inicializar a partir de `prefers-color-scheme` se não houver preferência guardada.
- `<meta name="theme-color">` = `#8DC63F`.

## PWA — checklist
1. `vite-plugin-pwa` com `registerType: 'autoUpdate'`, `manifest` (usar `manifest.webmanifest` do bundle como base).
2. Precache do app-shell; runtime cache (StaleWhileRevalidate) para a API GET de treinos.
3. **Servir sobre HTTPS** (o SW não corre em `file://`).
4. Ícones maskable 192/512 (incluídos).
5. Prompt de "instalar" e de "nova versão disponível".
6. Offline: o treino em curso vive em IndexedDB; os logs gravados offline entram numa **fila de sync** que envia ao voltar a rede.

## Notas de portabilidade do protótipo
- Os estilos inline e o objeto `GP` mutável → migrar para **CSS vars + Tailwind**.
- O routing por `switch(screen)` → **React Router**.
- O contexto único (`AppCtx`) → dividir em **React Query** (dados) + **Zustand** (UI).
- Os dados *seed* (`SEED_PROGRAMS`, `SEED_LOGS`) → substituir por chamadas à API (ver `API_CONTRACT.md`).
- O `image-slot.js` (persistência em sidecar) → substituir por **upload real** para o backend/storage.
