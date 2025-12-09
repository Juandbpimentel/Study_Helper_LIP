# Study Helper - Backend

Backend da aplicação Study Helper, desenvolvido com **NestJS** e **Node.js 24**.

## 🛠️ Tecnologias

-   **Framework:** [NestJS](https://nestjs.com/)
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
-   **Runtime:** [Node.js 24](https://nodejs.org/)
-   **Banco de Dados:** PostgreSQL
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **Infraestrutura:** Docker (Banco de Dados local), Render (Deploy)

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
-   Node.js 24+
-   Docker & Docker Compose

### Passo a Passo

1.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do diretório `backend`:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/studyhelper?schema=public"
    PORT=8080
    ```

2.  **Iniciar o Banco de Dados:**
    ```bash
    docker-compose up -d
    ```

3.  **Instalar Dependências:**
    ```bash
    npm install
    ```

4.  **Rodar Migrations:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Iniciar o Servidor:**
    ```bash
    npm run start:dev
    ```
    A API estará disponível em: `http://localhost:8080`

## 🧪 Testes e Qualidade

-   **Linting:** `npm run lint`
-   **Build:** `npm run build`
-   **CI/CD:** Pipelines configurados no GitHub Actions para validação de Pull Requests e Deploy automático.

## 🔒 Segurança e Migrations

-   Nunca edite `schema.prisma` ou arquivos SQL manualmente sem gerar migrations.
-   Use `npx prisma migrate dev` para sincronizar mudanças locais.
-   Em caso de conflito, use `npx prisma migrate reset` (cuidado com dados locais).
