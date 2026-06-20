# Handoff: GYMNOPRADO — App do Cliente (PWA de musculação)

## Overview
GYMNOPRADO é uma app **mobile-first (PWA)** para clientes de um ginásio focado em musculação (sem aulas). O cliente:
- vê os **treinos atribuídos pelo coach** (bloqueados, só leitura),
- cria/edita/clona **os seus próprios treinos**, organizados em **grupos** ("Treino 1", "Treino 2"…),
- **executa** um treino com cards deslizáveis por exercício, registo de séries (peso × reps) e **timer de descanso**,
- consulta **histórico** e **progresso de treino** (frequência, recordes pessoais, foco muscular),
- pode anexar uma **imagem/GIF** por exercício para o ilustrar.

O backoffice (gestão de clientes e atribuição de treinos pelo coach/dono) **já existe** — esta app é o **frontend do cliente** que consome essa API.

> A app deve responder a **mobile, tablet e desktop**. Cores: **branco + verde #8DC63F** (cor do logótipo). Estética: clean/minimalista (tipo Apple Fitness).

## About the Design Files
Os ficheiros neste bundle são **referências de design feitas em HTML/React (via Babel no browser)** — protótipos que mostram o aspeto e o comportamento pretendidos, **não código de produção para copiar diretamente**.

A tarefa é **recriar estes designs no ambiente alvo** usando os seus padrões e bibliotecas. Como ainda não existe codebase de frontend, a stack recomendada está em **`ARCHITECTURE.md`** (resumo: **React + Vite + TanStack Query + Zustand + vite-plugin-pwa**). O contrato de API sugerido está em **`API_CONTRACT.md`**.

Os componentes do protótipo são React e podem ser portados quase 1:1 — mas devem ser reescritos como ficheiros `.jsx`/`.tsx` próprios (não inline Babel) e com CSS/Tailwind em vez de estilos inline.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento, raios, sombras e interações são finais. Recriar pixel-perfect, usando os tokens listados abaixo. O único "lofi" são os dados — todos os números/treinos são *seed* de demonstração e devem vir da API.

---

## Design Tokens

### Cor — marca
| Token | Hex | Uso |
|---|---|---|
| `green` | `#8DC63F` | cor primária (botões, ativos, acentos) |
| `greenDk` (light) | `#6BA82E` | gradientes, texto sobre verde-claro |
| `greenLt` (light) | `#EBF6D3` | fundo de badges/realces |
| `greenXlt` (light) | `#F4FAE8` | fundos muito suaves |
| `red` | `#EF4444` | apagar/erros |
| `orange` | `#F97316` | streak/realces secundários |

### Cor — tema claro
| Token | Hex |
|---|---|
| `bg` (fundo app) | `#F5F7F3` |
| `surface` (cards) | `#FFFFFF` |
| `dark` (hero/botão escuro) | `#15171B` |
| `t1` (texto principal) | `#1A1A1E` |
| `t2` (texto secundário) | `#6B7280` |
| `t3` (texto terciário) | `#9CA3AF` |
| `border` | `#E5E7EB` |

### Cor — tema escuro
| Token | Hex |
|---|---|
| `bg` | `#0D0F12` |
| `surface` | `#1A1D21` |
| `dark` | `#070809` |
| `t1` | `#F2F4F1` |
| `t2` | `#9CA3AB` |
| `t3` | `#646B72` |
| `border` | `#2A2E34` |
| `greenLt` | `#26331A` |
| `greenXlt` | `#1A2412` |
| `greenDk` | `#A6D65C` |

> Implementar como **CSS custom properties** trocadas por `:root[data-theme="dark"]`. O protótipo faz isto mutando um objeto `GP` e re-renderizando; num codebase real usar variáveis CSS é melhor.

### Cor — grupos musculares (chips e acentos)
`Peito #3B82F6` · `Costas #8B5CF6` · `Ombros #F59E0B` · `Bíceps #EC4899` · `Tríceps #EF4444` · `Pernas #10B981` · `Glúteos #F97316` · `Abdómen #6B7280`
(chips usam a cor a `18` de alfa no fundo + cor cheia no texto)

### Tipografia
- Família: **Plus Jakarta Sans** (pesos 400, 500, 600, 700, 800, 900).
- Escala usada: títulos de ecrã 22px (mobile) / 28px (desktop) **900**, hero 26–36px **900**, título de card 15–17px **700/800**, corpo 13–15px **400/500**, labels 11–13px **600/700**, micro 10–11px.
- `letter-spacing` negativo nos títulos grandes (`-0.03em`), números com `font-variant-numeric: tabular-nums` (timer, pesos).

### Espaçamento
Grelha de **4px**. Valores comuns: 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36. Padding de ecrã: 20px (mobile) / 32–36px (desktop).

### Raios
- Cards: **20px** · Inputs: **13px** · Botões: **10/13/15px** (sm/md/lg) · Pills/badges: **100px** · Ícones-quadro: 9–16px.

### Sombras (tema claro)
- `shadow`: `0 2px 16px rgba(0,0,0,0.07)`
- `shadowMd`: `0 4px 24px rgba(0,0,0,0.10)`
- `shadowLg`: `0 12px 48px rgba(0,0,0,0.16)`
(no tema escuro são mais fortes — ver `DARK_THEME` em `gp-components.jsx`)

### Animações
- `fadeIn` 0.25s, `slideUp` 0.4s `cubic-bezier(.2,.8,.2,1)`, `popIn`/`cardEnter` 0.3s.
- Botões: `transform: scale(0.96)` ao pressionar (0.12s).
- Troca de ecrã: fade 0.3s.

---

## Layout global & navegação
- **Desktop (≥1024px):** sidebar fixa à esquerda (248px) com logótipo, 5 itens de navegação, toggle de tema e cartão do utilizador. Conteúdo à direita.
- **Mobile/tablet (<1024px):** **bottom tab bar** fixa (5 itens: Início, Treinos, Histórico, Progresso, Perfil), com blur de fundo. Cabeçalho compacto com logótipo.
- Durante a **execução de treino** a navegação esconde-se (modo foco).
- Breakpoint único: **1024px**.

---

## Screens / Views

### 1. Login
- **Propósito:** autenticação por **email + palavra-passe**.
- **Layout:** centrado vertical, largura máx 400px, fundo branco com dois "glows" verdes radiais nos cantos. Logótipo grande no topo, subtítulo "A tua jornada começa aqui", 2 inputs (email, password, com ícones), botão primário full-width "Entrar", link "Esqueci a palavra-passe", rodapé "Não tens conta? Fala com o teu ginásio."
- **Estados:** loading ("A entrar…"), erro de validação (texto vermelho).

### 2. Dashboard (Início)
- **Propósito:** ponto de partida — treino de hoje + resumo.
- **Componentes:**
  - Cabeçalho: saudação por hora ("Bom dia/tarde/noite, {primeiro nome}"), pill de **streak** (🔥 + nº dias), avatar.
  - **Card hero "TREINO DE HOJE"**: fundo escuro (`dark`) com glows verdes, nome do treino, metadados (nº exercícios, séries, ~min), botão verde **"Começar Treino"**.
  - Card **"Esta semana"**: 7 pontos (dias), preenchidos a verde se houve treino; contadores (treinos, streak, total).
  - Card **"Progresso"**: anel de progresso (treinos da semana / meta 5) + meta semanal + séries desta semana.
  - Lista **"Últimos Treinos"** (3) → link "Ver tudo" para Histórico.

### 3. Treinos
- **Propósito:** ver e gerir treinos. **Dois separadores (segmented control):**
  - **🏋️ Do Coach** — programas/grupos atribuídos pelo coach. **Só leitura** (ícone de cadeado, sem editar/apagar). Aviso no topo a explicar o bloqueio. Cada treino tem **Iniciar** + **Clonar** (copia para "Os Meus").
  - **⭐ Os Meus** — grupos do cliente. Pode **criar grupo** ("Novo Grupo"), **adicionar treino** a um grupo, **editar/apagar/clonar/iniciar** treinos, e **apagar grupos** (exceto o último).
- **Camada de agrupamento:** cada separador lista **programas/grupos** (ex: "Treino 1") como **acordeões colapsáveis** (chevron, nome, contador, cadeado se coach). Dentro de cada grupo, uma grelha de **cards de treino**.
- **Card de treino:** barra de acento no topo (verde p/ meus, cinza p/ coach), nome + cadeado (se bloqueado), chips de grupos musculares, ícone, preview de 3 exercícios ("Nome … sets×reps"), e botões de ação.
- **Modais:** "Novo Grupo de Treino" (nome + sugestões) e "Clonar para que grupo?" (lista de grupos do cliente, só aparece se houver >1 grupo).

### 4. Pré-visualização do treino (Workout Detail)
- **Propósito:** ver o **plano completo antes de começar** (resolve "não obrigar a iniciar para ver").
- **Layout:** hero escuro com nome, chips de grupos, e 4 métricas (exercícios, séries, ~duração, foco). Botão "Voltar". Lista de exercícios: cada linha tem **slot de media** (imagem/GIF), número, nome, chip de grupo, resumo (séries/reps/kg/descanso) e **pills por série** ("10 reps 60kg"). Botão **"Editar"** só nos treinos próprios; nos do coach mostra "Plano do coach" (cadeado).
- **Barra fixa inferior:** botão grande **"Começar Treino"** (acima da bottom-nav no mobile).

### 5. Execução do treino (Workout Exec) — modo foco
- **Propósito:** fazer o treino, exercício a exercício.
- **Topo:** botão fechar (X), nome + cronómetro decorrido + contador de séries, botão "Terminar". Barra de progresso fina (verde).
- **Card deslizável por exercício** (swipe esquerda/direita ou setas; pontos de paginação no topo):
  - Banner de media (image-slot, 170px) com scrim e nome do exercício + "Exercício X/N" sobreposto.
  - Linha de alvos (Séries, Reps Alvo, Peso, Descanso).
  - **Registo de séries:** por cada série, steppers de **peso (±2.5)** e **reps (±1)** + botão de **check** (marca concluída → dispara timer de descanso e pinta a linha de verde).
  - Botão "Iniciar descanso ({rest}s)".
- **Timer de descanso (overlay):** ecrã escuro com anel circular a contar, +15s, pausa/play, saltar.
- **Navegação:** "Anterior" / "Próximo Exercício" (último vira "Terminar Treino").
- **Modal de fim:** troféu, resumo (duração, séries, — sem volume), "Guardar Treino" (grava um Log) / "Continuar a treinar".

### 6. Histórico
- **Propósito:** treinos realizados.
- 3 cards de stats no topo (Total treinos, Séries feitas, Streak). Lista **agrupada por semana** ("Esta Semana", "Semana de …"). Cada item: ícone, nome, "há X dias", duração + séries, e botão **"Repetir Treino"** (abre a pré-visualização).

### 7. Progresso (focado no treino — sem peso corporal)
- 4 cards: Treinos totais, Dias de streak, Séries feitas, Treinos/semana.
- **Gráfico de barras "Treinos por Semana"** (últimas 8 semanas; barra atual destacada a verde).
- **Recordes Pessoais:** peso máximo por exercício, ordenado (top 6).
- **Foco Muscular:** barras de distribuição por grupo muscular (%).
> NOTA: peso corporal, medidas e fotos foram **deliberadamente removidos** — a app é só treino.

### 8. Perfil
- Card hero: avatar, nome, "Membro desde …", badge "Membro Ativo", 2 stats (Tempo treinado h, Séries feitas).
- 4 cards de stats (Treinos, Streak, Planos, Meses de membro).
- Card de **toggle de tema** (claro/escuro).
- Lista de definições (Notificações, Unidades=kg, Conta, Privacidade, Suporte).
- Botão "Terminar Sessão".

### 9. Criar / Editar treino
- Cabeçalho com voltar + "Guardar" (desativado até ter nome + ≥1 exercício; mostra "✓ Guardado!").
- Card: input de nome + sugestões rápidas + **seletor de grupo** (chips dos grupos do cliente + "Novo grupo").
- Lista de exercícios: cada um com **slot de media**, nome, grupo, **steppers** de Séries/Reps/Peso/Descanso, e setas para reordenar + remover.
- Botão "Adicionar Exercício" → **modal de seleção** (filtro por grupo muscular + lista de exercícios da `EXERCISE_DB`).

---

## Interactions & Behavior
- **Navegação:** SPA, sem reload. Trocar ecrã faz scroll-to-top + fade.
- **Swipe** nos cards de execução (touch + rato): threshold ~80px; rotação subtil durante o arrasto.
- **Timer de descanso:** conta decrescente 1s, pausa, +15s, dispara automaticamente ao marcar uma série.
- **Cronómetro de treino:** conta o tempo total da sessão.
- **Clonar:** copia o treino (novos ids) para um grupo do cliente; se houver vários grupos, pergunta qual.
- **Acordeões** de grupo: expandir/colapsar.
- **Tema:** toggle persistido (ver Estado). Respeitar `prefers-color-scheme` na 1ª visita seria um plus.
- **Media por exercício:** drag-and-drop de imagem/GIF; persistir associado ao `exerciseId`.
- **Responsivo:** layout muda aos 1024px (sidebar ↔ bottom-nav).
- **Modo demo:** `?demo=1` entra direto no dashboard (usado pela vista de telemóvel) — útil para demos, remover/condicionar em produção.

## State Management
Estado **local de UI** (Zustand ou Context): `user/sessão`, `tema`, ecrã/rota atual, treino ativo em execução (séries marcadas, tempo, índice do exercício atual), estados de modais.
Estado **de servidor** (TanStack Query): programas/treinos (coach + meus), histórico (logs), perfil. Mutations: criar/editar/apagar treino, criar/apagar grupo, clonar, gravar log de treino.
**Offline:** cache de queries + IndexedDB (Dexie) para o treino conseguir ser feito e registado sem rede, sincronizando depois.

## Assets
- **Logótipo:** desenhado em código (quadrado verde + halter). Substituir pelo logótipo real do GYMNOPRADO quando disponível.
- **Ícones:** set SVG inline próprio (`GpIcon` em `gp-components.jsx`) — podem ser trocados por `lucide-react` (estilo equivalente).
- **Ícones PWA:** `icon-192.png`, `icon-512.png`, `icon-180.png` (gerados com o logótipo).
- **Fonte:** Plus Jakarta Sans (Google Fonts).
- **Media de exercícios:** fornecida pelo utilizador (slots vazios por defeito).

## Files (referências de design)
- `Gymnoprado.html` — entry point: estilos globais, dados seed, `App` (routing + estado + contexto), registo de PWA.
- `gp-components.jsx` — tokens (`GP`, temas), ícones, e UI base (botão, card, input, badge, avatar, modal, tabs, anel, navegação, layout, toggle de tema).
- `gp-screens.jsx` — ecrãs: Login, Dashboard, Treinos (+WorkoutCard), Histórico, Progresso, Criar/Editar, Perfil; e `EXERCISE_DB` / `GROUP_COLORS`.
- `gp-detail.jsx` — pré-visualização do treino + slot de media (`ExerciseMedia`).
- `gp-workout.jsx` — execução + timer de descanso.
- `Gymnoprado — App.html` — vista de apresentação (app dentro de um iPhone) + `ios-frame.jsx`.
- `image-slot.js` — componente do slot de imagem (drag-and-drop).
- `manifest.webmanifest`, `sw.js`, `icon-*.png` — base PWA.

Ver também: **`ARCHITECTURE.md`** (stack recomendada + estrutura de pastas) e **`API_CONTRACT.md`** (endpoints + modelos de dados).
