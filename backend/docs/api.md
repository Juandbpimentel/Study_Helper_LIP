# API (Backend) — Study Helper

Este documento descreve, de forma **minuciosa**, os endpoints do backend (NestJS) e os **JSONs** de requisição/resposta, incluindo propriedades, tipos, valores possíveis e finalidade.

> Observação: o Swagger/OpenAPI também está disponível em `/docs` quando o backend está rodando.

---

## Convenções gerais

### Base URL

- Local (padrão): `http://localhost:8080`

### Autenticação

- A maioria das rotas exige autenticação via **JWT**.
- O token é retornado no campo JSON `access_token` e também é gravado como cookie **httpOnly** com nome `access_token` (ou o valor de `AUTH_COOKIE_NAME`).
- Rotas autenticadas aceitam:
  - Cookie `access_token` (padrão)
  - Header `Authorization: Bearer <token>`

### Datas e horários (ISO)

- Quando o parâmetro/atributo diz “ISO”, espera-se uma string compatível com ISO 8601.
- Alguns filtros tratam a data como “dia inteiro” (início do dia até antes do próximo dia) — isso está indicado em cada endpoint.

### Paginação (padrão do projeto)

Alguns endpoints suportam paginação opcional com:

- `page` (number, mínimo 1): número da página
- `pageSize` (number, mínimo 1): itens por página
- `all` (boolean): quando `true`, **desativa** paginação e retorna todos os itens

Comportamento:

- Se `all=true`, retorna **array** (sem `{ items, meta }`).
- Se `page` ou `pageSize` for informado (e `all` não for `true`), retorna objeto paginado:

```json
{
  "items": [
    /* ... */
  ],
  "meta": {
    "total": 123,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

### Enums (Prisma)

#### `DiaSemana`

Valores possíveis:

- `Dom`, `Seg`, `Ter`, `Qua`, `Qui`, `Sex`, `Sab`

#### `TipoRegistro`

Valores possíveis:

- `EstudoDeTema` — estudo de um tema planejado (gera revisões automáticas)
- `Revisao` — conclusão de uma revisão programada
- `EstudoAberto` — estudo livre (opcionalmente associado a um tema)

#### `StatusRevisao`

Valores possíveis:

- `Pendente`
- `Concluida`
- `Adiada`
- `Atrasada`
- `Expirada`

---

## 1) Status

### `GET /`

**Descrição:** Verifica saúde da aplicação (monitoramento).

**Auth:** não

**Resposta 200 (string):**

- `"Hello World!"` (ou mensagem equivalente do serviço)

---

## 2) Autenticação (`/auth`)

### `POST /auth/login`

**Descrição:** Autentica usuário, emite JWT e grava cookie httpOnly.

**Auth:** não (usa credenciais)

**Body (LoginRequestDto):**

- `email` (string, obrigatório): email cadastrado
- `senha` (string, obrigatório, mín. 6)

**Resposta 200 (AuthSuccessResponseDto):**

- `message` (string): mensagem de confirmação
- `access_token` (string): JWT (também setado no cookie)
- `user` (UserResponseDto): dados públicos do usuário
- `googleCalendar` (GoogleCalendarBackendStatusDto): status do suporte a Google Calendar

**Efeitos colaterais:**

- Define cookie `access_token` (httpOnly). Em cenários cross-site, usa `SameSite=None` e `Secure`.

**Exemplo de request:**

```json
{ "email": "john@example.com", "senha": "Senha@123" }
```

---

### `POST /auth/logout`

**Descrição:** Encerra sessão removendo o cookie.

**Auth:** opcional (pode chamar mesmo sem login)

**Resposta 200 (LogoutResponseDto):**

- `message` (string)

---

### `POST /auth/register`

**Descrição:** Cria usuário, emite JWT inicial e grava cookie.

**Auth:** não

**Body (CreateUserDto):**

- `nome` (string, obrigatório)
- `email` (string, obrigatório, formato email)
- `senha` (string, obrigatório, mín. 6, com: 1 minúscula, 1 maiúscula, 1 número, 1 símbolo)

**Resposta 201 (AuthSuccessResponseDto):**

- mesmos campos do login

**Erros comuns:**

- `409 Conflict`: email já está em uso

---

### `GET /auth/profile`

**Descrição:** Retorna perfil do usuário autenticado.

**Auth:** sim (cookie ou bearer)

**Resposta 200 (AuthProfileResponseDto):**

- `id` (number)
- `email` (string)
- `nome` (string)
- `versaoToken` (string)
- `primeiroDiaSemana` (DiaSemana)
- `planejamentoRevisoes` (number[]) — offsets em dias (ex.: `[1,7,14]`)
- `maxSlotsPorDia` (number | null)
- `slotAtrasoToleranciaDias` (number) — tolerância (dias) para considerar slot atrasado
- `slotAtrasoMaxDias` (number) — máximo dias atrasado antes de voltar a pendente
- `revisaoAtrasoExpiraDias` (number | null)
- `createdAt` (string ISO date-time)
- `updatedAt` (string ISO date-time)

---

### `PATCH /auth/change-password`

**Descrição:** Troca senha e **rota** o token (novo JWT + cookie atualizado).

**Auth:** sim

**Body (ChangeUserPasswordDto):**

- `senhaAntiga` (string, obrigatório)
- `novaSenha` (string, obrigatório, mesmas regras de força do cadastro)

**Resposta 200:**

- `message` (string)
- `access_token` (string)
- `user` (UserResponseDto)

---

### `PATCH /auth/change-email`

**Descrição:** Troca email (exige senha) e emite novo JWT.

**Auth:** sim

**Body (ChangeUserEmailDto):**

- `senha` (string, obrigatório)
- `novoEmail` (string, obrigatório, formato email)

**Resposta 200:**

- `message` (string)
- `access_token` (string)
- `user` (UserResponseDto)

---

## 3) Usuários (`/users`)

> Todas as rotas em `/users` exigem autenticação.

### `GET /users`

**Descrição:** Lista usuários. **Apenas admin**.

**Auth:** sim (admin)

**Query (paginação opcional):** `page`, `pageSize`, `all`

**Resposta 200:**

- Sem paginação: `UserResponseDto[]`
- Com paginação: `{ items: UserResponseDto[], meta: { total, page, pageSize, totalPages } }`

---

### `GET /users/:id`

**Descrição:** Busca usuário por id.

**Auth:** sim

**Params:**

- `id` (number)

**Resposta 200 (UserResponseDto)**

---

### `PATCH /users/:id`

**Descrição:** Atualiza perfil (nome, planejamento, primeiro dia da semana). Apenas o próprio usuário ou admin.

**Auth:** sim

**Params:**

- `id` (number)

**Body (UpdateUserDto):**

- `nome` (string, obrigatório)
- `planejamentoRevisoes` (number[], obrigatório, mín. 1 item, cada item >= 1)
- `primeiroDiaSemana` (DiaSemana, obrigatório)

**Resposta 200 (UserResponseDto)**

---

### `PATCH /users/:id/preferences`

**Descrição:** Atualiza preferências do cronograma/atraso. Apenas o próprio usuário ou admin.

**Auth:** sim

**Params:**

- `id` (number)

**Body (UpdateUserPreferencesDto) — parcial:**

- `maxSlotsPorDia` (number | null, opcional)
  - quando `null`: remove limite
  - quando omitido: não altera
  - quando number: mínimo 1
- `slotAtrasoToleranciaDias` (number, opcional, mínimo 0)
- `slotAtrasoMaxDias` (number, opcional, mínimo 1)
- `revisaoAtrasoExpiraDias` (number | null, opcional)
  - quando `null`: revisões atrasadas não expiram
  - quando number: mínimo 1

**Resposta 200 (UserResponseDto)**

---

### `PATCH /users/:id/role`

**Descrição:** Concede/remove admin. Apenas admin.

**Auth:** sim (admin)

**Params:**

- `id` (number)

**Body (UpdateUserRoleDto):**

- `isAdmin` (boolean)

**Resposta 200 (UserResponseDto)**

---

### `DELETE /users/:id`

**Descrição:** Remove conta. Apenas o próprio usuário ou admin.

**Auth:** sim

**Params:**

- `id` (number)

**Resposta 200 (UserResponseDto)** (registro removido retornado pelo Prisma)

**Efeitos colaterais (best-effort):**

- Se houver integração com Google Calendar, tenta remover eventos antes de deletar o usuário.

---

## 4) Temas de Estudo (`/themes`)

> Todas as rotas em `/themes` exigem autenticação.

### `POST /themes`

**Descrição:** Cria tema.

**Auth:** sim

**Body (CreateThemeDto):**

- `tema` (string, obrigatório, máx 255)
- `descricao` (string, opcional, máx 1000)
- `cor` (string, opcional, hex `#RRGGBB`)

**Resposta 201 (ThemeResponseDto / TemaDeEstudoDto):**

- `id`, `tema`, `descricao`, `cor`, `creatorId`, `createdAt`, `updatedAt`

---

### `GET /themes`

**Descrição:** Lista temas do usuário, com contadores.

**Auth:** sim

**Query (paginação opcional):** `page`, `pageSize`, `all`

**Resposta 200:**

- Sem paginação: `ThemeWithCountersResponseDto[]`
- Com paginação: `{ items: ThemeWithCountersResponseDto[], meta: ... }`

**ThemeWithCountersResponseDto:**

- campos do tema (`TemaDeEstudoDto`)
- `_count`:
  - `slots` (number): quantidade de slots usando o tema
  - `registros` (number): quantidade de registros usando o tema

---

### `GET /themes/:id`

**Descrição:** Detalha um tema, incluindo slots que o usam e registros recentes.

**Auth:** sim

**Params:**

- `id` (number)

**Resposta 200 (ThemeDetailResponseDto):**

- campos do tema
- `slots` (SlotCronogramaDto[])
- `registros` (RegistroEstudoBaseDto[]) — últimos 5

---

### `PATCH /themes/:id`

**Descrição:** Atualiza tema.

**Auth:** sim

**Body (UpdateThemeDto):** (parcial)

- `tema` (string, opcional)
- `descricao` (string, opcional)
- `cor` (string, opcional)

**Resposta 200 (ThemeResponseDto)**

---

### `DELETE /themes/:id`

**Descrição:** Remove tema.

**Auth:** sim

**Resposta 200 (ThemeResponseDto)**

---

## 5) Cronogramas (`/cronograma`)

> Todas as rotas em `/cronograma` exigem autenticação.

### `GET /cronograma`

**Descrição:** Retorna cronograma semanal com status dos slots.

**Auth:** sim

**Query:**

- `referencia` (string ISO date-time, opcional): data base para montar a semana (se omitida, usa “hoje”)

**Resposta 200 (CronogramaComStatusResponseDto):**

- `semana`:
  - `referencia` (string ISO)
  - `inicio` (string ISO)
  - `fim` (string ISO)
- `cronograma`:
  - `id` (number)
  - `slots` (CronogramaSlotResponseDto[])

**CronogramaSlotResponseDto:**

- `id` (number)
- `diaSemana` (DiaSemana)
- `ordem` (number)
- `dataAlvo` (string ISO): próxima ocorrência planejada do slot
- `status` (`concluido` | `pendente` | `atrasado`)
- `tema` (TemaDeEstudoDto | null)

---

### `PUT /cronograma`

**Descrição:** Cria/atualiza cronograma semanal substituindo a lista de slots.

**Auth:** sim

**Body (UpsertCronogramaDto):**

- `slots` (SlotCronogramaInputDto[], obrigatório, até 200)

**SlotCronogramaInputDto:**

- `id` (number, opcional): se informado, atualiza slot existente
- `diaSemana` (DiaSemana, obrigatório)
- `ordem` (number, obrigatório, mínimo 0)
- `temaId` (number, obrigatório)

**Resposta 200:** `CronogramaComStatusResponseDto`

**Regras importantes:**

- Se `maxSlotsPorDia` estiver definido no usuário, o backend valida esse limite ao salvar.
- O tema (`temaId`) precisa pertencer ao usuário.

---

### `DELETE /cronograma/slots/:id`

**Descrição:** Remove um slot específico do cronograma.

**Auth:** sim

**Params:**

- `id` (number)

**Resposta 200:** objeto do slot removido (retorno do Prisma) ou payload equivalente.

**Efeitos colaterais:**

- Remove dependências associadas (registros/revisões do slot) por transação.
- Se houver evento no Google Calendar, tenta remover (best-effort).

---

## 6) Registros de Estudo (`/registros`)

> Todas as rotas em `/registros` exigem autenticação.

### `GET /registros`

**Descrição:** Lista registros do usuário, opcionalmente filtrando por dia.

**Auth:** sim

**Query:**

- `data` (string ISO date-time, opcional): filtra pelo dia (início do dia até antes do próximo)
- `page`, `pageSize`, `all` (paginação opcional)

**Resposta 200:**

- Sem paginação: `RegistroListagemItemDto[]`
- Com paginação: `{ items: RegistroListagemItemDto[], meta: ... }`

**RegistroListagemItemDto (RegistroEstudoCompletoDto):**

- campos do `RegistroEstudoBaseDto`
- `tema` (TemaDeEstudoDto | null)
- `slotCronograma` (SlotCronogramaDto | null)
- `revisoesGeradas` (RevisaoProgramadaBaseDto[])
- `revisaoConcluida` (RevisaoProgramadaBaseDto | null)

---

### `POST /registros`

**Descrição:** Cria um registro de estudo (ou conclusão de revisão).

**Auth:** sim

**Body (CreateRegistroDto):**

- `tipoRegistro` (TipoRegistro, obrigatório)
- `tempoDedicado` (number, obrigatório, mínimo 1) — minutos
- `conteudoEstudado` (string, opcional, máx 1000)
- `temaId` (number, opcional)
- `slotId` (number, opcional)
- `revisaoProgramadaId` (number, opcional)
- `dataEstudo` (string ISO date-time, opcional)

**Regras de negócio por `tipoRegistro`:**

- `EstudoDeTema`
  - exige `temaId` (tema do usuário)
  - exige `slotId` (slot do usuário)
  - `temaId` deve ser igual ao `temaId` do slot
  - gera revisões automáticas com base em `planejamentoRevisoes` do usuário
- `Revisao`
  - exige `revisaoProgramadaId` (revisão do usuário)
  - não pode concluir revisão já concluída
  - conclui a revisão programada (status `Concluida`) e vincula o registro como conclusão
- `EstudoAberto`
  - `temaId` é opcional
  - **não** permite `revisaoProgramadaId`

**Resposta 200 (RegistroCriadoResponseDto):**

- registro criado com detalhes (tema e slot), e revisões geradas quando aplicável

---

### `DELETE /registros/:id`

**Descrição:** Remove um registro.

**Auth:** sim

**Params:**

- `id` (number)

**Resposta 200:** objeto do registro removido (retorno do Prisma).

**Efeitos colaterais importantes:**

- Se o registro era a conclusão de alguma revisão, a revisão é reaberta (`registroConclusaoId=null`, status `Pendente`).
- Revisões geradas pelo registro são removidas (cascade no relacionamento de origem).
- Eventos no Google Calendar são limpos/ressincronizados best-effort.

---

## 7) Revisões Programadas (`/revisoes`)

> Todas as rotas em `/revisoes` exigem autenticação.

### `GET /revisoes`

**Descrição:** Lista revisões do usuário. Antes de listar, o backend pode atualizar automaticamente status (Pendente/Adiada → Atrasada; Atrasada → Expirada, etc.).

**Auth:** sim

**Query:**

- `status` (StatusRevisao, opcional)
- `dataInicial` (string ISO date-time, opcional)
- `dataFinal` (string ISO date-time, opcional)
- `page`, `pageSize`, `all` (paginação opcional)

**Resposta 200:**

- Sem paginação: `RevisaoProgramadaDetalhadaResponseDto[]`
- Com paginação: `{ items: RevisaoProgramadaDetalhadaResponseDto[], meta: ... }`

**RevisaoProgramadaDetalhadaResponseDto (RevisaoProgramadaDetalheDto):**

- campos da revisão (`RevisaoProgramadaBaseDto`)
- `registroOrigem` (RegistroEstudoComDetalhesDto | null)
- `registroConclusao` (RegistroEstudoBaseDto | null)

**Observação sobre expiração:**

- Se `revisaoAtrasoExpiraDias` (preferência do usuário) estiver definido, revisões `Atrasada` podem virar `Expirada` após esse limite.

---

### `DELETE /revisoes/:id`

**Descrição:** Remove revisão programada.

**Auth:** sim

**Params:**

- `id` (number)

**Resposta 200:** objeto da revisão removida (retorno do Prisma).

**Efeito colateral:**

- Remove evento no Google Calendar (best-effort) se existir `googleEventId`.

---

### `PATCH /revisoes/:id/concluir`

**Descrição:** Conclui uma revisão programada criando um registro do tipo `Revisao`.

**Auth:** sim

**Params:**

- `id` (number)

**Body (ConcluirRevisaoDto):**

- `tempoDedicado` (number, obrigatório, mínimo 1)
- `conteudoEstudado` (string, opcional, máx 1000)
- `dataEstudo` (string ISO date-time, opcional)

**Resposta 200:** `RevisaoProgramadaDetalhadaResponseDto`

**Efeito colateral:**

- Ressincroniza/deleta evento no Google Calendar conforme status final.

---

### `PATCH /revisoes/:id/adiar`

**Descrição:** Adia uma revisão (muda data e marca como `Adiada`).

**Auth:** sim

**Params:**

- `id` (number)

**Body (AdiarRevisaoDto):**

- `novaData` (string ISO date-time, obrigatório) — o backend normaliza para início do dia

**Resposta 200:** `RevisaoProgramadaBasicaResponseDto`

**Regra:**

- Revisão `Concluida` não pode ser adiada.

---

## 8) Relatórios (`/relatorios`)

> Todas as rotas em `/relatorios` exigem autenticação.

### `GET /relatorios/resumo`

**Descrição:** Retorna métricas agregadas (registros, revisões, temas) e ofensiva.

**Auth:** sim

**Query (ResumoRelatorioQueryDto):**

- `dataInicial` (string ISO, opcional) — período (inclusive)
- `dataFinal` (string ISO, opcional) — período (inclusive)
- `temaId` (number, opcional) — filtra por tema do usuário

**Resposta 200 (ResumoRelatorioResponseDto):**

- `periodo`:
  - `dataInicial` (string `YYYY-MM-DD` | null)
  - `dataFinal` (string `YYYY-MM-DD` | null)
- `ofensiva`:
  - `atual` (number)
  - `bloqueiosTotais` (number) — sempre 2
  - `bloqueiosUsados` (number)
  - `bloqueiosRestantes` (number)
  - `ultimoDiaAtivo` (string `YYYY-MM-DD` | null)
- `totalEstudos` (number)
- `tempoTotalEstudado` (number) — minutos
- `diasComEstudo` (number)
- `tempoMedioPorDiaAtivo` (number)
- `registrosPorTipo` (array de `{ tipoRegistro, quantidade, tempoTotal }`)
- `revisoesConcluidas` (number)
- `revisoesPendentes` (number) — inclui `Pendente` e `Adiada`
- `revisoesAtrasadas` (number)
- `revisoesExpiradas` (number)
- `revisoesHoje` (number) — revisões pendentes/adiadas para o dia de hoje (respeita `temaId` quando informado; vira 0 se hoje estiver fora do período)
- `desempenhoPorTema` (array de `{ temaId, tema, cor, quantidadeEstudos, tempoTotal }`)

**Observação sobre ofensiva:**

- A ofensiva é calculada a partir dos registros mais recentes (janela interna ~400 dias) e **não é reduzida** pelo período.

---

## 9) Integrações — Google Calendar (`/integrations/google`)

### `GET /integrations/google/oauth/start`

**Descrição:** Inicia OAuth do Google Calendar.

**Auth:** sim

**Query:**

- `redirect` (string, opcional): se `1|true|yes`, responde com redirect (302) para a URL do Google

**Resposta 200 (JSON) quando não redireciona:**

- `ok` (boolean)
- `authUrl` (string)
- `redirect` (boolean)

---

### `GET /integrations/google/oauth/callback`

**Descrição:** Callback do OAuth. Troca `code` por tokens, salva a integração e sincroniza.

**Auth:** não (é chamado pelo Google)

**Query:**

- `code` (string, obrigatório)
- `state` (string, obrigatório)

**Resposta:**

- Normalmente: redireciona para a URL final de retorno (`302`)
- Alternativamente (sem `res`): `{ ok: true, redirectUrl: "..." }`

---

### `DELETE /integrations/google/disconnect`

**Descrição:** Desconecta Google Calendar (remove tokens/IDs). Não apaga eventos já criados no Google automaticamente.

**Auth:** sim

**Resposta 200:**

```json
{ "ok": true }
```

---

## 10) Público

> Estes endpoints existem para suporte a políticas/termos e redirecionamentos. Estão excluídos do Swagger.

### `GET /privacy`

**Descrição:** HTML (política de privacidade).

### `GET /terms`

**Descrição:** HTML (termos de serviço).

### `GET /home`

**Descrição:** Redireciona para `/docs`.
