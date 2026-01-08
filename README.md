# Study Helper 📚

Sistema de gerenciamento de estudos, cronogramas e revisões para auxiliar durante a jornada universitária.

## 🚀 Quick Start

### Opção A (Recomendado): Docker Compose (tudo local)

Pré-requisitos:

- Docker + Docker Compose (v2)

1. Suba tudo (Postgres + Backend + Frontend):

```bash
docker compose up --build
```

2. Acesse:

- Frontend: http://localhost:3000
- API (Backend): http://localhost:8080
- Swagger: http://localhost:8080/docs

Observações:

- O compose aplica as migrations automaticamente com `prisma migrate deploy`.
- Se você editar código, rode novamente com `docker compose up --build`.

#### Variáveis de ambiente (Compose)

O `docker-compose.yml` da raiz aceita variáveis via `.env` na raiz do repositório (opcional). Exemplo mínimo:

```env
JWT_SECRET=dev_jwt_secret_change_me

# Opcional (Google Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_TOKEN_ENCRYPTION_KEY=
```

Para ativar o microserviço PDF, use o profile `pdf` na hora de rodar o compose:

```bash
docker compose --profile pdf up --build
```

### Backend

1. Inicie o banco de dados:

```bash
cd backend
docker-compose up -d
```

2. Inicie a aplicação:

```bash
npm install
npx prisma generate
npm run start:dev
```

API disponível em: http://localhost:8080

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponível em: http://localhost:3000

## 📁 Estrutura

```
Study_Helper_LIP/
├── frontend/          # Next.js + TypeScript + Tailwind
├── backend/           # NestJS + TypeScript + PostgreSQL + Prisma
└── .github/workflows/ # CI/CD automático
```

## 📚 Documentação Completa

- **Backend**: [backend/README.md](backend/README.md)
- **Frontend**: [frontend/README.md](frontend/README.md)
- **CI/CD**: [backend/GITHUB-SECRETS.md](backend/GITHUB-SECRETS.md)

## 🛠️ Tecnologias

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Node.js 24  
**Backend:** NestJS, TypeScript, PostgreSQL, Prisma, Node.js 24  
**Infra:** Docker, GitHub Actions, Supabase

## 🛡️ Segurança e Migrations (Trabalho em Equipe)

Para evitar conflitos de banco de dados durante o desenvolvimento em equipe, siga estas regras:

1.  **Nunca edite o arquivo `schema.prisma` manualmente sem gerar uma migration.**
2.  **Nunca edite arquivos SQL dentro de `prisma/migrations` manualmente.**
3.  **Antes de criar uma nova migration:**
    - Faça `git pull origin dev` para garantir que você tem as últimas migrations.
    - Rode `npx prisma migrate dev` para sincronizar seu banco local.
4.  **Se houver conflito de migration (erro de checksum):**
    - Não tente resolver manualmente editando o SQL.
    - Apague sua migration local conflitante.
    - Rode `npx prisma migrate reset` (CUIDADO: apaga dados locais) para alinhar com a branch remota.
    - Gere sua migration novamente.

### Verificação Automática (CI)

O pipeline de Pull Request (`backend-test-pr.yml`) executa automaticamente:

- `npx prisma validate`: Verifica se o arquivo schema é válido.
- `npx prisma migrate deploy`: Testa se as migrations podem ser aplicadas num banco limpo sem erros.

Isso garante que nenhuma migration quebrada chegue à branch `dev` ou `main`.

## 🤝 Contribuindo

1. Clone o repositório
2. Faça checkout para a branch dev: `git checkout origin/dev`
3. Crie uma branch: `git checkout -b feature/nome`
4. Commit: `git commit -m 'feat: descrição'`
5. Push: `git push origin feature/nome`
6. Abra um Pull Request

Padrão: [Conventional Commits](https://www.conventionalcommits.org/)

## 📝 Licença

MIT License - veja [LICENSE](LICENSE)

## 👤 Autor

**Juan Pimentel** - [@Juandbpimentel](https://github.com/Juandbpimentel)

---

**Feito com ❤️ para estudantes universitários**
