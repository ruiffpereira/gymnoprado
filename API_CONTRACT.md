# Contrato de API — GYMNOPRADO (proposta)

> Proposta de contrato entre a app do cliente e o backoffice existente. Ajustar nomes ao que o backoffice já expõe. Convenções: REST, JSON, auth por **Bearer token (JWT)**, datas em **ISO 8601**, pesos em **kg**.

## Modelos de dados

```ts
// Exercício dentro de um treino (prescrição do plano)
interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;        // 'Peito' | 'Costas' | 'Ombros' | 'Bíceps' | 'Tríceps' | 'Pernas' | 'Glúteos' | 'Abdómen'
  sets: number;              // nº de séries prescritas
  reps: number;              // reps alvo por série
  weight: number;            // kg prescritos (0 = peso corporal)
  rest: number;              // segundos de descanso
  mediaUrl?: string | null;  // imagem/GIF que ilustra o exercício
  order: number;
}

interface Workout {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];   // derivado dos exercícios (ou guardado)
  exercises: Exercise[];
  createdAt: string;
  lastDone: string | null;
  order: number;
}

// Camada de agrupamento ("Treino 1"); owner define quem o controla
interface Program {
  id: string;
  name: string;                  // ex: "Treino 1"
  owner: 'coach' | 'client';     // 'coach' => só leitura na app
  note?: string;
  workouts: Workout[];
  order: number;
}

// Registo de uma sessão concluída
interface WorkoutLog {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;                  // ISO
  durationMin: number;
  totalSets: number;             // séries concluídas
  // opcional: detalhe por série, para recordes reais
  entries?: { exerciseId: string; sets: { weight: number; reps: number; done: boolean }[] }[];
}

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  streak: number;                // dias seguidos (pode ser calculado no backend)
}
```

> **Nota sobre "volume":** foi removido da UI por decisão de produto. O campo `entries` (peso×reps por série) continua útil para **recordes pessoais reais** e pode ser guardado mesmo sem o mostrar como volume.

## Endpoints

### Auth
```
POST /auth/login            { email, password } -> { token, profile }
POST /auth/logout
GET  /auth/me               -> ClientProfile
POST /auth/forgot-password  { email }
```

### Programas & treinos
```
GET  /programs                       -> Program[]   // inclui owner: 'coach' (atribuídos) e 'client' (do utilizador)
POST /programs                       { name } -> Program            // cria grupo do cliente
PATCH /programs/:id                  { name } -> Program            // renomear (só client)
DELETE /programs/:id                                                 // apagar grupo (só client)

POST /programs/:id/workouts          { name, exercises[] } -> Workout   // criar treino no grupo (client)
PATCH /workouts/:id                  { ...Workout } -> Workout          // editar (só client)
DELETE /workouts/:id                                                    // apagar (só client)
POST /workouts/:id/clone             { targetProgramId } -> Workout     // clonar (coach->client ou duplicar)
```
- Treinos com `owner: 'coach'` devem rejeitar `PATCH/DELETE` no backend (a app já os bloqueia na UI).
- **Atribuição pelo coach** acontece no backoffice; a app só os lê via `GET /programs`.

### Histórico & sessões
```
GET  /logs?from=&to=        -> WorkoutLog[]            // ordenado desc por data
POST /logs                  { workoutId, durationMin, totalSets, entries? } -> WorkoutLog
```

### Progresso (pode ser derivado no cliente a partir de /logs e /programs)
```
GET  /stats/summary         -> { totalWorkouts, streak, totalSets, avgPerWeek }
GET  /stats/weekly          -> { weekStart: string, count: number }[]   // últimas 8 semanas
GET  /stats/records         -> { exerciseName, group, weight }[]        // recordes por exercício
```
> Em alternativa, calcular tudo no cliente com os dados de `/logs` + `/programs` (como faz o protótipo) e dispensar `/stats`.

### Media de exercícios
```
POST /exercises/:id/media   (multipart) -> { mediaUrl }   // upload de imagem/GIF
DELETE /exercises/:id/media
```

## Regras de negócio
- Um cliente só vê os **seus** programas + os **atribuídos pelo coach**.
- `owner: 'coach'` ⇒ imutável pela app (só o backoffice altera).
- Clonar coach→cliente cria cópia com **novos ids** e `owner: 'client'` no grupo escolhido.
- `streak` e métricas de progresso podem ser calculadas no backend (preferível) ou no cliente.
- Gravação de log deve ser **idempotente/offline-friendly** (aceitar um `clientId`/UUID gerado no telemóvel para evitar duplicados na sync).

## Offline / sync
- App guarda o treino em curso e os logs por enviar em IndexedDB.
- Ao recuperar rede, envia a fila de `POST /logs` (com UUID para dedupe).
- `GET /programs` e `GET /logs` com cache StaleWhileRevalidate.
