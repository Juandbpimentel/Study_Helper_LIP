# Study Helper (Backend) — Como o sistema funciona

Este documento explica o funcionamento do backend do **Study Helper** (NestJS + Prisma/PostgreSQL): arquitetura, módulos, fluxos principais, regras de negócio e rotinas automáticas.

> Para documentação endpoint-a-endpoint, veja também: `backend/docs/api.md`.

## 1) Visão geral da arquitetura

- **Framework:** NestJS (controllers, services, modules)
- **Persistência:** Prisma ORM + PostgreSQL
- **Autenticação:** JWT (Bearer e/ou cookie httpOnly)
- **Documentação:** Swagger em `/docs`
- **Integrações:** Google Calendar (OAuth + sync)
- **Rotinas automáticas:** `@nestjs/schedule` com cron diário

### Organização em pastas

- `src/app.module.ts`: módulo raiz que compõe o sistema.
- Cada feature fica em uma pasta própria em `src/` (ex.: `src/auth`, `src/users`, `src/revisoes`, `src/ofensiva`, `src/jobs`).
- Utilitários e helpers compartilhados ficam em `src/common/utils` (ex.: datas, paginação, cálculo de ofensiva).

### Convenções

- Alias de import: `@/` aponta para `src/` (configurado no Jest e tsconfig).
- Erros “de regra de negócio” usam exceções Nest (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, etc.) para virar HTTP 4xx.
- Operações com “efeito colateral externo” (Google Calendar) são **best-effort**: o banco é fonte da verdade, e o Google é sincronizado quando possível.

## 2) Boot do servidor (`main.ts`)

Arquivo: `src/main.ts`

1. **Cria a aplicação Nest** (`NestFactory.create(AppModule)`)
2. **Validação global** com `ValidationPipe`:
   - `whitelist: true` remove campos desconhecidos
   - `forbidNonWhitelisted: true` rejeita payloads com campos extras
   - `transform: true` converte tipos (ex.: query string → number) quando DTO permite
3. **CORS robusto**:
   - Normaliza origens via `new URL(origin).origin` (quando possível)
   - Em dev permite localhost/hoppscotch
   - Se a origem não for permitida, **não lança erro 500**: apenas responde sem CORS headers (o browser bloqueia naturalmente)
4. **cookie-parser** habilitado
5. **Swagger** em `/docs` via `SwaggerModule.setup('docs', ...)`

## 3) Banco de dados (Prisma) e entidades

Arquivo: `prisma/schema.prisma`

### Entidades principais

- `Usuario`
  - Preferências:
    - `primeiroDiaSemana`, `planejamentoRevisoes`
    - `maxSlotsPorDia`, `slotAtrasoToleranciaDias`, `slotAtrasoMaxDias`
    - `revisaoAtrasoExpiraDias`
  - Ofensiva (persistida):
    - `ofensivaAtual`, `ofensivaBloqueiosTotais`, `ofensivaBloqueiosUsados`
    - `ofensivaUltimoDiaAtivo`, `ofensivaAtualizadaEm`
- `TemaDeEstudo`
- `CronogramaSemanal` → contém `SlotCronograma`
- `SlotCronograma` → vincula um `TemaDeEstudo` a um dia da semana (e opcionalmente ordem)
- `RegistroEstudo` → registro de estudo (tema/slot/revisão)
- `RevisaoProgramada` → revisão gerada a partir de um registro (ou concluída via outro registro)
- `GoogleCalendarIntegration` → tokens/estado da integração do usuário

### Regras de integridade

- Quase todas relações do usuário usam `onDelete: Cascade`.
- Isso garante que apagar usuário “varre” cronograma, slots, temas, registros e revisões.
- Para Google Calendar, antes do cascade ocorrer, o sistema tenta remover eventos associados (best-effort).

## 4) Autenticação e sessão (`auth`)

### Como o login funciona

- `AuthService` valida credenciais (bcrypt) e emite JWT.
- O controller grava o JWT também em cookie **httpOnly** para uso pelo frontend.

### JWT e rotação

- O payload inclui `versaoToken` do usuário.
- Ao trocar email/senha, a versão é rotacionada (invalidando tokens antigos).

### Guards/Strategies

- `LocalStrategy` para login (email/senha)
- `JwtStrategy` para rotas protegidas
- Guards adicionais (ex.: admin/ownership) para autorização

### Respostas enriquecidas

- Login/register/profile retornam:
  - dados do usuário
  - `ofensiva` (resumo atual + bloqueios)
  - status do backend para Google Calendar (`googleCalendar`)

## 5) Usuários (`users`)

- CRUD/admin: listar, buscar por id, atualizar perfil, atualizar preferências, definir admin, remover.
- Endpoint dedicado para ofensiva:
  - `GET /users/me/ofensiva` retorna o `OfensivaDto` do usuário autenticado.

## 6) Temas (`themes`)

- CRUD de temas por usuário.
- Cada slot do cronograma aponta para um tema.

## 7) Cronograma semanal (`cronogramas`)

O cronograma é uma estrutura semanal que define “slots” de estudo.

Regras relevantes (alto nível):

- `dataAlvo` sempre aponta para a **próxima ocorrência futura** quando a ocorrência anterior já passou.
- Atraso não “acumula infinito”: o slot não fica atrasado por meses; há um limite semanal e políticas de tolerância.
- Preferências do usuário influenciam:
  - `maxSlotsPorDia`
  - tolerância e máximo de dias de atraso

## 8) Registros de estudo (`registros`)

- Um registro é a “prova” de atividade.
- Tipos (`TipoRegistro`):
  - `EstudoDeTema`, `Revisao`, `EstudoAberto`

Efeitos colaterais importantes:

- Ao criar/remover registro, a ofensiva do usuário é recalculada e persistida.
- Se um registro concluiu uma revisão, remover o registro “reabre” a revisão antes de apagar, evitando violação de FK.
- Sincronização Google Calendar de revisões/slots é best-effort.

## 9) Revisões (`revisoes`)

- Revisões são criadas a partir de um registro origem, seguindo o `planejamentoRevisoes` do usuário.
- Status (`StatusRevisao`): `Pendente`, `Concluida`, `Adiada`, `Atrasada`, `Expirada`

Atualização automática de status:

- Quando o sistema lista/atua em revisões, ele chama `atualizarStatusAutomatico(usuarioId)`.
- Regra de expiração opcional: `revisaoAtrasoExpiraDias` (se configurada, revisões atrasadas por mais de N dias ficam `Expirada`).

## 10) Ofensiva (streak) e bloqueios (`ofensiva`)

Objetivo: oferecer uma métrica tipo Duolingo.

### Conceitos

- **Dia ativo:** qualquer dia (UTC, startOfDay) em que houve pelo menos 1 `RegistroEstudo`.
- **Ofensiva atual:** quantidade de dias ativos “encadeados” na sequência.
- **Bloqueios:** até 2 (por padrão) dias “perdidos” que não quebram a sequência.

### Regra crítica (dia inteiro sem atividade)

- O sistema **só consome bloqueio** quando um dia inteiro passa sem atividade.
- Em termos práticos:
  - se `ultimoDiaAtivo` foi ontem → não consome
  - se `ultimoDiaAtivo` foi anteontem → consome 1
  - gaps maiores consomem proporcionalmente (`diffEmDias - 1`)

### Onde a ofensiva é atualizada

- Em tempo real (melhor feedback): ao criar/remover registros (`RegistrosService`) chama `recalcularEAtualizar(usuarioId)`.
- Em background (por tempo): um cron diário chama `atualizarPorTempoTodosUsuarios()` para refletir consumo de bloqueios sem precisar de request.

## 11) Jobs programados (`jobs`)

- Scheduler habilitado em `AppModule` via `ScheduleModule.forRoot()`.
- Job diário (1AM):
  - atualiza ofensivas “por tempo”
  - atualiza status de revisões para todos os usuários

Importante:

- Jobs são best-effort: falha em uma etapa não impede a outra.

## 12) Paginação padrão

Algumas listagens aceitam `page`, `pageSize` e `all`.

- `all=true` → retorna array simples
- Paginação ativa → retorna `{ items, meta }`

## 13) Integração Google Calendar (`integrations/google`)

- OAuth e armazenamento de tokens por usuário (`GoogleCalendarIntegration`).
- Sync de eventos para slots e revisões.
- Remoções são best-effort e normalmente executadas fora de transações.

## 14) Como rodar e depurar

- `npm run start:dev`
- Swagger: `http://localhost:8080/docs`
- Testes: `npm test`
- Lint: `npm run lint`

## 15) Próximos passos sugeridos (manutenção)

- Expandir testes unitários por módulo (sucesso + exceções)
- Consolidar documentação Swagger “mini-contrato JSON” diretamente nas descrições dos endpoints com body
