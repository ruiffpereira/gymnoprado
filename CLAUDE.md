# CLAUDE.md — GYMNOPRADO (PWA do cliente)

App **mobile-first (PWA)** de musculação para os clientes de um ginásio. Consome o módulo **Gym** da API central (`../API-FullStack`). O coach/dono gere tudo no Backoffice; esta app é o **frontend do cliente**.

- **Design / UX / tokens:** ver [README.md](README.md) (alta fidelidade, branco + verde `#8DC63F`).
- **Stack recomendada:** ver [ARCHITECTURE.md](ARCHITECTURE.md) (React + Vite + TanStack Query + Zustand + vite-plugin-pwa + Dexie offline).
- **Contrato proposto (histórico):** [API_CONTRACT.md](API_CONTRACT.md) — proposta original. **As rotas reais já implementadas estão abaixo e têm precedência.**

> Estado: **backend Gym completo e testado**. Frontend PWA implementado (ver `src/screens/`).
>
> **Treino do dia / programa ativo:** o coach marca um **programa ativo** por cliente no backoffice. O Dashboard mostra o programa ativo e o **treino a fazer agora** (`nextWorkoutId`), calculado no servidor pela regra *"treino menos vezes concluído → empate por ordem"* — faltar/saltar treinos é tratado automaticamente. A `weeklyGoal` (nº de dias do programa) alimenta o anel de meta semanal. O cliente pode na mesma escolher outro treino na lista. As datas do programa são só informativas. Manual hook: `useActiveProgram` em [src/hooks/useGym.ts](src/hooks/useGym.ts) (usa o `axiosInstance` partilhado; quando regenerares o Kubb com a API a correr, podes trocar por um hook gerado).

---

## Autenticação

O cliente é um **`Customer`** na API (multi-tenant por `userId` do ginásio). **Reutiliza o módulo Customers** — não há auth nova:

- `POST /api/websites/customers/autentication/login` `{ userId, provider:"credentials", email, password }` → access token + refresh cookie.
- O `userId` (id do ginásio/tenant) vem do `.env` da app (`VITE_USER_ID`), tal como nos outros sites de cliente.
- Enviar o access token em `Authorization: Bearer <token>` nos pedidos `/api/websites/gym/*`.
- Refresh/logout: `…/autentication/refresh` e `…/autentication/logout` (CSRF + cookie).

O middleware injeta no backend `req.customerId` (o cliente) e `req.userId` (o tenant). **Todos os dados são automaticamente isolados** — a app nunca envia `customerId`.

---

## Endpoints reais (prefixo `/api/websites/gym`)

Todos exigem `Authorization: Bearer <customer token>`.

| Método | Path | Uso na app |
| ------ | ---- | ---------- |
| `GET` | `/me` | Perfil + `streak` (Dashboard, Perfil) |
| `GET` | `/programs/active` | **Programa ativo** (escolhido pelo coach) + `nextWorkoutId` (treino a fazer agora) + `weeklyGoal`. Usado no Dashboard (hero "treino de hoje" + meta semanal) via `useActiveProgram` |
| `GET` | `/programs` | Lista grupos: `owner:"coach"` (só leitura) + `owner:"client"`, com `workouts[].exercises[]` aninhados (Treinos) |
| `POST` | `/programs` `{ name, note? }` | Criar grupo do cliente |
| `PATCH` | `/programs/:id` `{ name?, note? }` | Renomear grupo próprio (coach → 403) |
| `DELETE` | `/programs/:id` | Apagar grupo próprio (coach → 403; último grupo → 409) |
| `POST` | `/programs/:programId/workouts` `{ name, exercises[] }` | Criar treino (programa do coach → 403) |
| `PATCH` | `/workouts/:id` `{ name?, exercises? }` | Editar treino próprio; `exercises` substitui tudo |
| `DELETE` | `/workouts/:id` | Apagar treino próprio |
| `POST` | `/workouts/:id/clone` `{ targetProgramId }` | Clonar (coach→meu ou duplicar). Destino tem de ser grupo próprio |
| `GET` | `/exercises?group=` | Catálogo activo do tenant para o modal "Adicionar Exercício" |
| `GET` | `/logs?from=&to=` | Histórico (desc por data) |
| `POST` | `/logs` `{ workoutId?, workoutName, date?, durationMin, totalSets, clientUuid?, entries? }` | Gravar sessão. **Idempotente** por `clientUuid` |
| `GET` | `/stats/summary` | `{ totalWorkouts, streak, totalSets, avgPerWeek }` |
| `GET` | `/stats/weekly` | 8 semanas: `{ weekStart, count }[]` (Progresso → gráfico de barras) |
| `GET` | `/stats/records` | Recordes pessoais `{ exerciseName, group, weight }[]` (top 6) |

### Formas de dados (resposta)

```ts
// /programs  → Program[]
interface Program { id; name; owner:"coach"|"client"; note:string|null; customerId; order; workouts: Workout[] }
interface Workout { id; name; muscleGroups:string[]; lastDone:string|null; order; exercises: Exercise[] }
interface Exercise { id; exerciseId:string|null; name; group; sets; reps; weight; rest; mediaUrl:string|null; order }
```

`group`/`muscleGroup` ∈ `Peito · Costas · Ombros · Bíceps · Tríceps · Pernas · Glúteos · Abdómen`.

### Diferenças face ao API_CONTRACT.md proposto

- Prefixo real é **`/api/websites/gym`** (não `/programs` à raiz).
- Login/perfil vêm do **módulo Customers** (`/api/websites/customers/...` + `/api/websites/gym/me`), não `/auth/*`.
- Stats são **calculados no servidor** (`/stats/*`) — não é preciso derivar no cliente.
- Bloqueio de treinos do coach é garantido **no backend** (403), além da UI.
- `entries` no `POST /logs`: `[{ exerciseName, group?, sets:[{ weight, reps, done }] }]` — alimenta os recordes.

---

## Offline / PWA

- `POST /logs` aceita um **`clientUuid`** (UUID gerado no telemóvel) → a fila de sync pode reenviar sem criar duplicados (índice único `(customerId, clientUuid)` devolve o log existente com `200`).
- Cachear `GET /programs`, `/logs`, `/exercises` com StaleWhileRevalidate.
- Treino em curso vive em IndexedDB (Dexie); ao recuperar rede, drenar a fila de `POST /logs`.

---

## Media de exercícios

Upload via o módulo `uploads/` da API (`POST /api/uploads`, autenticado). Guardar o `mediaUrl` devolvido no exercício (campo `mediaUrl` em `WorkoutExercise`, ou `mediaUrl` no catálogo gerido pelo coach).

---

## Geração de código (Kubb)

**Todos os endpoints e tipos vêm do Kubb** — não escrever chamadas/tipos à mão.

- Spec OpenAPI: a API expõe `/api-docs/websites/gym.json` (definido em `API-FullStack/swagger/websites/gym/swaggerGym.ts`, com glob dos controllers `controllers/websites/gym/**` + paths de auth inline).
- Config: [kubb.config.ts](kubb.config.ts) lê esse spec (via `VITE_API_BASE_URL`) → gera para `src/gen/` (hooks React Query + types + schemas).
- Regenerar quando a API muda: **`pnpm kubb`** (precisa da API a correr em `localhost:3001`).
- Os hooks gerados usam o `axiosInstance` partilhado do Kubb, configurado em [src/api/client.ts](src/api/client.ts) (baseURL + Bearer + refresh automático + CSRF).
- [src/api/index.ts](src/api/index.ts) é uma **facade** com nomes curtos (`usePrograms`, `createWorkout`, tipos `GymProgram`…) por cima de `src/gen`. Os ecrãs importam daqui.
- Auth orquestrada em [src/api/session.ts](src/api/session.ts) (login/logout/forgot por cima dos hooks gerados).

Estrutura: `src/gen/` (gerado) · `src/api/` (cliente + facade + sessão) · `src/store/` (Zustand: tema, sessão, treino activo) · `src/components/` (UI Tailwind + nav) · `src/screens/` (9 ecrãs) · `src/hooks/` (invalidação + helpers) · `src/lib/` (tema, formatação, toast, exercícios).

> **Treino activo** ([src/store/useActiveWorkout.ts](src/store/useActiveWorkout.ts), Zustand + `persist` → localStorage `gymnoprado_active_workout`, `version:2`): guarda o treino a decorrer **incluindo o estado de descanso/pausa** (`rest: { endsAt, total, kind, msg, exIdx, setIdx } | null`). O descanso vive no store (não em estado local do `WorkoutExec`) para **sobreviver a fechar/reabrir a PWA**. O `endsAt` é **wall-clock** (epoch ms, commit `3a01c28`): os segundos restantes derivam-se sempre de `endsAt - now` (nunca um contador decremental, que congelava com a app em background no Android). `finishRest()` conclui a série guardada em `exIdx/setIdx` e avança via `advanceAfterSet()`; `cancelRest()` sai do descanso sem avançar. O `begin()` (`WorkoutDetail.tsx`) **retoma** um treino em curso do mesmo `workoutId` (não faz reset). Wake lock (`navigator.wakeLock`) mantém o ecrã aceso durante o treino.
>
> **Overhaul do ecrã de execução (`WorkoutExec.tsx`, 2026-07-07 — brief `.design/workout-exec-overhaul/`):** (1) **Série ATUAL vs SELECIONADA** — a atual (`currentSetIdx` = 1.ª `!done && !skipped`, a que o CTA/descanso concluem) tem **border azul a piscar** (`--now`, `.set-current-pulse`); a selecionada (`selectedSet[exIdx]`, renomeada de `activeSet`; migração v2) é a que os steppers/referência mostram e editam — clicar num botão de série muda a vista sem avançar a sequência; uma série `done` fica só-leitura, mas clicar numa série **saltada desfaz o skip** (skip é reversível — volta a por fazer/editável). Quando espreitas outra série, o subtítulo do CTA nomeia a série atual que vai concluir. (2) **Skip** — `skipped?: boolean` no `SetEntry` (skip **≠** done: fica por fazer, fora do log via `buildLog` e do contador de concluídas); ações `skipSet`/`skipExercise` + helper `advanceSequence`; **removido** o picker "Escolher outro exercício" — a navegação de volta a um exercício (incl. saltado) faz-se pelos **dots de exercício no topo (clicáveis)**, e os quadrados de série aparecem sempre que há trabalho por fazer (`hasWork` = alguma `!done`, incl. saltadas) para se poder tocar e desfazer o skip. O card de fim de exercício distingue *concluído* (todas `done`, check verde) de *terminado com saltos* (dica fina "toca numa série para a fazer"). (3) **Layout sem scroll** — `h-[100dvh] overflow-hidden` flex; header/CTA `shrink-0`; só o meio (`flex-1 min-h-0`) scrolla se preciso. (4) **Status bar** do dispositivo escura durante o treino (`useStatusBarColor`, ambos os temas). (5) Referência do último treino **por série**, discreta. (6) Botão de descanso mostra "A seguir: `<série/exercício por extenso>`" truncado + countdown. Textos novos via CMS (`gym.app.exec.*` no `content-import.csv`).

> **Durabilidade do registo de treino (batch P1, 2026-07-21):** o registo do treino nunca se perde. (1) **`clientUuid`** gerado no `start()` (persistido no store, `version:3`) e enviado no `buildLog()` junto com a **`date` local** (`localDateISO`, nunca UTC) — a API dedupa por `(customerId, clientUuid)`, retries são seguros. (2) **Fila offline persistida** ([src/store/usePendingLogs.ts](src/store/usePendingLogs.ts), zustand+persist → `gymnoprado_pending_logs`): um `POST /logs` falhado por causa transitória (sem rede/timeout/5xx) entra na fila e é drenado no arranque, no evento `online` e ao voltar a ficar visível (`usePendingLogsSync` em `App.tsx`); banner discreto no Dashboard (`PendingSyncBanner`, toca para tentar já); ao drenar invalida histórico/stats (`invalidateGym`). 4xx é definitivo — não se re-enfileira no envio inicial. (3) **Descanso nunca engole séries**: navegar pelos dots e "Terminar" durante um descanso fazem `finishRest()` (conclui a série que o descanso ia fechar), nunca `cancelRest()`. (4) **Sessão só morre com 401/403** (`isAuthApiError`): offline/500/timeout no restauro mantêm o token e re-tentam com backoff (`App.tsx`). (5) **Confirmações destrutivas**: "Cancelar treino" é dois toques; apagar treino/grupo na lista tem modal (como o detalhe); `begin()` com outro treino em curso pede confirmação; tocar numa série saltada só seleciona — repor é o botão explícito "Repor esta série". (6) **TTL**: treino ativo reidratado com >6h mostra "Retomar / Descartar" na `ActiveWorkoutBar` em vez de "EM TREINO" eterno; treino com 0 exercícios não arranca. (7) **`WorkoutEditor` faz round-trip** de `type`/`duration`/`notes`/`mediaUrl`/`mode`/`setRows` (o PATCH substitui `exercises` por inteiro); mexer nos steppers de uma linha perSet converte-a para uniforme ao guardar — sem toque, `setRows` segue intacto.

> **Interação da execução (P2a, 2026-07-21):** dots de exercício e steppers com alvo de toque ≥44px (`hit44` em `index.css` — pseudo-elemento, visual intacto); **vibração + beep duplo** no fim do descanso e do cronómetro (`src/lib/feedback.ts`, Web Audio lazy no 1.º gesto); steppers com **press-and-hold** (repete a 130ms após 400ms; `clickUnlessHeld` suprime o click sintético do pointerup) e **tocar no valor abre input numérico** (`inputmode` certo); **cronómetro wall-clock** para exercícios de tempo (padrão `endsAt` do descanso — não marca a série sozinho); media do exercício (lazy + fullscreen) e `notes` do coach visíveis; dropset com `rest: 0` mostra o cue "BAIXA O PESO" ~2.5s; exercícios de tempo herdam a duração da última sessão.
>
> **Infra/polimento (P2b) + i18n (P3, 2026-07-21):** datas locais no Dashboard/History (fim do desvio UTC); séries não feitas distinguidas no histórico e tempo mostra `Xs`; auth com `<form>` real + `autocomplete` + toggle de password; `Modal` com `role=dialog`/Escape/scroll-lock; zoom desbloqueado; `PullToRefresh` ignora gestos dentro de scrolláveis/dialogs; `NetworkFirst` com `networkTimeoutSeconds:3`; `refetchOnWindowFocus` LIGADO (retomar a app traz programa/stats frescos); push `notificationclick` navega para `data.url`. **i18n:** `greeting`/`relativeDays` recebem `t()` (chaves `gym.app.time.*`/`gym.app.greeting.*`); InstallPrompt/ThemeToggle traduzidos; dias da semana e grupos musculares via CMS (`translateWeekday*`/`translateMuscleGroup` em [src/lib/exercises.ts](src/lib/exercises.ts) — o `GroupChip` traduz o TEXTO, a cor continua pelo token cru); date-fns com locale dinâmico ([src/lib/dateLocale.ts](src/lib/dateLocale.ts), default PT). **Contrato:** `spec.gym.json`/`src/gen` são gitignored e re-buscados no build à API VIVA — ordem de deploy: **API primeiro, PWA depois**; os tipos gerados já cobrem `mode`/`setRows`/`subGroup`/`media` (único cast restante: `duration` do GET last-performance).
>
> **Mensalidade do membro (só-leitura)** — secção no **Perfil** (`MensalidadeCard`) + **banner no Dashboard** (`MensalidadeBanner`, só quando há mês por pagar/em atraso). Hook manual [src/hooks/useMensalidade.ts](src/hooks/useMensalidade.ts) → `GET /websites/gym/mensalidade` (subscrição + mês corrente **derivado** + histórico). Estado visível: **paga** (verde) · **por pagar** desde o dia 1 (laranja) · **em atraso** após o `dueDay` da subscrição (vermelho). Pagamento é em **dinheiro ao balcão** — a app nunca regista pagamentos (quem marca é o coach no Backoffice). A derivação de estado é a **mesma fonte de verdade** do backoffice (`API-FullStack/src/utils/mensalidade.ts`). Strings em `gym.app.mensalidade.*` (CMS).

## Conteúdo / Traduções (CMS)

**Todo o texto da app vem do CMS** (multi-língua), à semelhança dos sites públicos (ex.: tifas-barber). Padrão:

- **`LanguageProvider`** ([src/context/LanguageContext.tsx](src/context/LanguageContext.tsx)) — lê `GET /websites/languages` (línguas ativas + padrão), guarda `currentLang` (localStorage + `PUT /websites/languages/me` se autenticado).
- **`CmsProvider`** ([src/context/CmsContext.tsx](src/context/CmsContext.tsx)) — lê `GET /websites/content?locale=` (mapa `key→valor`) e expõe **`t(key)`**. **Sem fallback**: se a chave não existir no CMS, devolve vazio (`""`). Usa `keepPreviousData` (troca de língua sem flash).
- **`LanguageSwitcher`** ([src/components/LanguageSwitcher.tsx](src/components/LanguageSwitcher.tsx)) — pills das línguas ativas (no Perfil).
- Hooks do CMS **gerados pelo Kubb** em [src/gen-cms](src/gen-cms) (a partir de `/api-docs/websites/content.json`); a `kubb.config.ts` tem agora **dois specs** (gym → `src/gen`, content → `src/gen-cms`). A facade [src/api/cms.ts](src/api/cms.ts) só envolve esses hooks gerados (sem chamadas manuais).

**Regra:** nenhum texto literal nos ecrãs — usar `t('gym.app.<área>.<chave>')`, **sem fallback**. O texto vem **exclusivamente do CMS**; por isso **é obrigatório importar o `content-import.csv`** (senão a app fica sem texto). As chaves usam o prefixo **`gym.`** → contexto **Ginásio** no CMS. Os pares chave/valor (pt/en) vivem no `content-import.csv`.

> Os **nomes** de programas/treinos/exercícios já vêm traduzidos da API (resolvidos pela locale do cliente). Isto é para os **textos da interface**.

### Importar os textos para o CMS (CSV)

O ficheiro [content-import.csv](content-import.csv) tem as chaves + valores (pt/en). Para importar:

1. Backoffice → **Conteúdos** → tab **Ginásio** → botão **Importar** → escolher o `content-import.csv`.
2. Importar **na tab Ginásio** é essencial: o importador cria as secções com `context: gym`, por isso o conteúdo fica no separador certo.
3. Formato do CSV (6 colunas `key,locale,value,type,section,parent`) — ver [Backoffice/CLAUDE.md](../Backoffice/CLAUDE.md) → secção *CMS → Importar conteúdo via CSV*.

> **Todos os ecrãs** estão convertidos (Dashboard, Workouts, History, Progress, WorkoutDetail, WorkoutExec, WorkoutEditor, Profile, nav, e auth Login/Register/Forgot/Reset). Ao adicionar texto novo, usar `t('gym.app.<área>.<chave>', 'fallback')` e acrescentar a chave (pt/en) ao `content-import.csv`.

## Backend (referência)

Módulo **Gym** em `../API-FullStack` — ver [API-FullStack/CLAUDE.md](../API-FullStack/CLAUDE.md) → secção *11. Gym*. Modelos: `Program → Workout → WorkoutExercise`, `WorkoutLog → WorkoutLogEntry`, `ExerciseCatalog`. RBAC do backoffice: componente `VIEW_GYM`.
