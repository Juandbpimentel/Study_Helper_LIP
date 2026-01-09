# Study Helper - Backend

Backend da aplicação Study Helper, desenvolvido com **NestJS** e **Node.js 24**.

## 🛠️ Tecnologias

- **Framework:** [NestJS](https://nestjs.com/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Runtime:** [Node.js 24](https://nodejs.org/)
- **Banco de Dados:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Infraestrutura:** Docker (Banco de Dados local), Render (Deploy)

## 📁 Estrutura do Projeto

```
src/
├── app.module.ts        # Módulo raiz
├── main.ts              # Ponto de entrada (Porta 8080)
├── prisma/              # Configuração e serviço do Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── users/               # Módulo de Usuários (CRUD)
    ├── dto/             # Data Transfer Objects
    ├── users.controller.ts
    ├── users.module.ts
    └── users.service.ts
```

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 22+
- Docker & Docker Compose

### Passo a Passo

> Dica: para subir **Postgres + Backend + Frontend** com 1 comando, use o Docker Compose da raiz do repositório (veja o [README principal](../README.md)).

1.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do diretório `backend`:

    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyhelper?schema=public"
    PORT=8080
    FRONTEND_URL=http://localhost:3000
    ```

    Se for usar a integração com **Google Calendar**, adicione também:

    ```env
    GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="..."
    GOOGLE_REDIRECT_URI="http://localhost:8080/integrations/google/oauth/callback"
    GOOGLE_CALENDAR_APP_NAME="Study Helper"
    GOOGLE_TOKEN_ENCRYPTION_KEY="(32 bytes em base64 ou hex)"
    ```

2.  **Iniciar o Banco de Dados:**

    Opção A (recomendado para desenvolvimento local com Node rodando na sua máquina): subir só o Postgres.

    ```bash
    docker compose up -d postgres
    ```

    Opção B (compose local do backend): subir Postgres + Backend juntos.
    - Backend: http://localhost:8081
    - Swagger: http://localhost:8081/docs
    - Postgres: localhost:5433

    ```bash
    docker compose up -d --build
    ```

3.  **Instalar Dependências:**

    ```bash
    npm install
    ```

4.  **Rodar Migrations:**
    - Se estiver usando o compose local (Opção B), as migrations já são aplicadas automaticamente no startup do container com `prisma migrate deploy`.
    - Se estiver rodando o backend fora do Docker (Node local), use:

    ```bash
    npx prisma migrate dev
    ```

5.  **Iniciar o Servidor:**
    ```bash
    npm run start:dev
    ```
    A API estará disponível em: `http://localhost:8080`

### Prisma Studio (opcional)

Com o banco rodando, você pode abrir o Prisma Studio:

```bash
npx prisma studio
```

## 🧪 Testes e Qualidade

- **Linting:** `npm run lint`
- **Build:** `npm run build`
- **CI/CD:** Pipelines configurados no GitHub Actions para validação de Pull Requests e Deploy automático.

## 🔒 Segurança e Migrations

- Nunca edite `schema.prisma` ou arquivos SQL manualmente sem gerar migrations.
- Use `npx prisma migrate dev` para sincronizar mudanças locais.
- Em caso de conflito, use `npx prisma migrate reset` (cuidado com dados locais).

## 🗓️ Integração Google Calendar (OAuth + Sync)

### Setup no Google Cloud

1. No Google Cloud Console, crie/seleciona um projeto
2. Habilite a **Google Calendar API**
3. Configure o **OAuth consent screen** (externo/interno) e adicione seu usuário como _Test user_ (se estiver em modo teste)
4. Crie credenciais **OAuth Client ID** (tipo: Web application)
5. Em **Authorized redirect URIs**, adicione exatamente:
   - `http://localhost:8080/integrations/google/oauth/callback`
6. Copie `Client ID` e `Client secret` para o `.env`

### Rotas

- `GET /integrations/google/oauth/start` (requer login/cookie JWT): inicia o consentimento e redireciona para o Google
- `GET /integrations/google/oauth/callback`: endpoint de retorno do Google (troca code por token + sync)
- `DELETE /integrations/google/disconnect` (requer login/cookie JWT): remove a integração salva

### Chave GOOGLE_TOKEN_ENCRYPTION_KEY

O refresh token é armazenado criptografado (AES-256-GCM). Gere uma chave de 32 bytes e coloque no `.env`.

Exemplo (base64):

```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
