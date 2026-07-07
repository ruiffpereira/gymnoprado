# Design Brief — Overhaul do ecrã de treino (WorkoutExec)

Data: 2026-07-07 · Alvo: `src/screens/WorkoutExec.tsx` + `src/store/useActiveWorkout.ts` + `content-import.csv`
Pedido do utilizador (6 pontos) + decisões de design abaixo. Regra da app: **todo o texto vem do CMS** (`t('gym.app.exec.*')`, com fallback PT inline como hoje) e as chaves novas entram no `content-import.csv` (pt/en).

## 1. Layout sem scroll — tudo cabe no ecrã
**Problema:** raiz `min-h-[100dvh]` + header `sticky top-0` + CTA `fixed bottom-0` + `paddingBottom: calc(160px+safe)` mágico → scrolla o **documento inteiro** (o "scroll no meio").
**Decisão:** wrapper raiz `h-[100dvh] overflow-hidden flex flex-col`. Header e CTA passam a `shrink-0` **dentro do flex** (deixam de ser `sticky`/`fixed`; ficam presos por serem irmãos flex de topo/fundo). O conteúdo do meio é `flex-1 min-h-0`, centrado, **compacto** (gaps menores, dots/steppers dimensionados para caber). Remover o `paddingBottom:160px`. Meta: **zero scroll** no caso normal (≤4-6 séries). Se um exercício tiver MUITAS séries e não couber, só o contentor do meio (`flex-1 min-h-0`) ganha `overflow-y-auto` — **nunca** o documento. Referência do padrão correto: o Modal (`components/ui/index.tsx` — `max-h flex flex-col` + `flex-1 overflow-y-auto` só no corpo).

## 2. Status bar do dispositivo acompanha o header escuro
**Problema:** `WorkoutExec` nunca chama `useStatusBarColor`; a status bar fica em `DEFAULT` (clara em tema light) por trás do header sempre-escuro (`bg-ink`) → "costura" visível.
**Decisão:** dentro de `WorkoutExec`, chamar `useStatusBarColor(INK, INK)` onde `INK` = o valor real de `bg-ink` (o mesmo em light e dark, ex. `#070809`/o hex do token `--dark`) — a status bar fica escura em **ambos** os temas durante o treino. O hook já restaura o `DEFAULT` ao desmontar (cleanup do `useEffect`). Confirmar o hex exato do token no `index.css`.

## 3. Série ATUAL (sequência, azul a piscar) vs SELECIONADA (o que clicas, mostra reps)
**Modelo de duas posições** (hoje só existe `activeSet`, que serve de ambas e reabre séries feitas):
- **`currentSet`** = posição na SEQUÊNCIA = 1.ª série `!done && !skipped`. Recebe **border azul a piscar** (`#3B82F6`, animação de pulse subtil na border). É a série que o CTA "FAZER AGORA" conclui e sobre a qual corre o descanso — **"segue a sequência onde estiver"**, independente do que está selecionado.
- **`selectedSet`** = índice de VISTA (clicar num botão de série define-o). Por omissão = `currentSet`; quando `currentSet` avança, `selectedSet` acompanha para a nova atual. **Clicar numa série só muda `selectedSet`** — NÃO avança a sequência, NÃO marca/desmarca `done` ("não passa à frente").
- Os **steppers peso/reps/duração** e a **referência do último treino** refletem `selectedSet`; editar edita os valores de `selectedSet`.
- Visual: `currentSet` = border azul a piscar; `selectedSet` (quando ≠ current) = um destaque estático distinto (ex. fundo `--surface` + ring ténue), para os dois serem distinguíveis. Séries `done` = check verde; `skipped` = estado neutro/riscado discreto.

## 4. Skip de série + skip de exercício (remove "Escolher outro exercício")
> **REGRA CRÍTICA (o utilizador reforçou): SKIP ≠ DONE.** Uma série saltada **fica por fazer** — NUNCA marca `done`, NÃO conta como "série concluída" (o contador "X/Y séries concluídas" só conta `done`), NÃO entra no log. O `skipped` serve só para **sair da sequência** (não ser pedida outra vez), não para a dar como feita.
- **Adicionar `skipped?: boolean`** ao `SetEntry` (independente de `done`; uma série é `done` XOR `skipped` XOR pendente). Sequência "próxima" = 1.ª série `!done && !skipped`. O **log exclui** séries `skipped` (não entram em `entries[].sets`). O contador de concluídas conta só `done`.
- **"Saltar série"**: marca `currentSet` como `skipped` (**não** `done` — fica por fazer), cancela descanso se em curso, avança a sequência para a próxima `!done && !skipped`. Não é registada.
- **"Saltar exercício"**: marca todas as séries **pendentes** (`!done && !skipped`) do exercício atual como `skipped` (as já `done` mantêm-se `done`) e passa ao próximo exercício (ou fim, se último).
- **Exercício "terminado" (avança)** quando cada série é `done || skipped` (podes sair dele); **exercício "concluído"** (todas `done`) é o único que conta 100% — distinção que alimenta os dots de progresso e o contador.
- **Remover** o botão "Escolher outro exercício" **e o seu modal picker** (`showPicker`, `jumpTo`). A navegação passa a ser linear (skip para a frente + os botões de série para rever dentro do exercício).
- **Manter** "Dar exercício como concluído" (marca todas as pendentes `done` = feito/registado; distinto de saltar = não feito, fica por fazer).
- Colocação: uma linha de ações secundárias **compacta** por baixo dos steppers, ex.: `Saltar série · Saltar exercício · Concluir exercício` (links pequenos `text-t3`, uma linha) — respeitando o orçamento vertical do ponto 1.

## 5. Referência do último treino, por série, discreta
Já existe por série (`selectedSet.lastWeight/lastReps/lastDuration`). Tornar **discreta** e ligada a `selectedSet`: uma linha pequena e ténue (`text-t3`, ~11-12px) por baixo (ou por cima) dos steppers, ex. `Último: 12,5 kg · 10 reps`. **Esconde se não houver** (`== null`). Nada de card próprio — só uma linha subtil.

## 6. CTA "FAZER AGORA"/pausa mostra o que vem a seguir (por extenso + reticências)
- Compor o "a seguir" **por extenso**: próxima **série** ("Série N de M") ou, se acaba o exercício, o **próximo exercício por nome** (nome traduzido vindo do store). Reaproveitar a lógica que já existe em `completeAndRest` (`msg`).
- **Estado de pausa:** o botão mostra o rótulo "A seguir: <extenso>…" (com `truncate`/reticências, `flex-1 min-w-0`) **+** o countdown (`shrink-0`) lado a lado — como o descanso é longo, o rótulo trunca com reticências e o tempo fica sempre legível.
- **Estado "fazer agora":** manter "FAZER AGORA" + subtítulo; o subtítulo pode indicar o "a seguir" resumido.
- Tempo TOTAL do treino fica no **header** (como hoje). Só mover para junto do CTA se o layout do ponto 1 o exigir (decisão do implementador; por defeito, não mexer).
- Chaves CMS novas para o "a seguir" por extenso (ver abaixo).

## Strings CMS novas (adicionar ao `content-import.csv`, pt + en, contexto `gym`)
Seguir o padrão existente `t('gym.app.exec.<chave>') || 'fallback pt'`. Chaves sugeridas:
- `gym.app.exec.skip_set` → "Saltar série" / "Skip set"
- `gym.app.exec.skip_exercise` → "Saltar exercício" / "Skip exercise"
- `gym.app.exec.next_up_set` → "A seguir: {n}ª série de {m}" / "Next: set {n} of {m}" (ou versão sem interpolação se o `t()` não suportar — usar composição no código)
- reaproveitar `gym.app.exec.next_up_exercise` para "A seguir: {nome}"
- `gym.app.exec.last_short` (se preciso um rótulo) → "Último" / "Last"

> O utilizador reimporta o `content-import.csv` no Backoffice (Conteúdos → Ginásio → Importar). O fallback PT inline garante que a app funciona antes disso.

## Fora de âmbito / a preservar
- Não partir a pausa wall-clock (`rest.endsAt`, commit `3a01c28`) nem o wake lock nem o `begin()` que retoma treino em curso.
- Não partir o `POST /logs` (idempotente por `clientUuid`) — só garantir que `skipped` não entra nas `entries`.
- App é light+dark; o ecrã de treino é escuro nos dois (`bg-ink`/`bg-bg` do treino), manter.
