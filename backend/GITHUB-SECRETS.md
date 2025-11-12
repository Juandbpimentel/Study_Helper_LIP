# 🔐 Guia de Configuração - GitHub Secrets & Environments

## 📋 Visão Geral

Este guia mostra como configurar os **GitHub Environments** e **Secrets** para deploy automático via GitHub Actions.

> **⚠️ IMPORTANTE**: Este guia lista TODOS os secrets que os workflows REALMENTE usam. 
> Os nomes dos secrets aqui correspondem EXATAMENTE ao que está nos arquivos `.github/workflows/*.yml`.

### 🏗️ Arquitetura do Projeto

- **Frontend**: Netlify (https://netlify.com)
- **Backend**: Render com Docker (https://render.com)
- **Database**: Configurada no Render via variáveis de ambiente

### 📦 Secrets vs Environment Variables

- **Secrets do GitHub**: 
  - **Para CI/CD**: Deploy hooks, tokens de autenticação, URLs dos serviços
  - **Para Testes**: Credenciais do Supabase para rodar migrations e testes nos workflows
- **Environment Variables no Render**: 
  - **Para Runtime**: Configurações do backend (database, JWT, CORS) usadas pela aplicação em produção
- **Environment Variables no Netlify**: 
  - **Para Build**: Configurações do frontend (API URLs) injetadas no build do Next.js

⚠️ **IMPORTANTE**: As credenciais do Supabase são usadas em **DOIS lugares**:
1. **GitHub Secrets** → Para workflows rodarem migrations e testes no CI/CD
2. **Render Environment Variables** → Para a aplicação conectar ao banco em runtime

---

## 🌍 GitHub Environments

O projeto usa **3 environments** no GitHub:

1. **`development`** (branch: `dev`)
   - Frontend: Netlify Dev Site
   - Backend: Render Dev Service (Docker)
   - Database: Supabase Dev Project

2. **`production`** (branch: `main`)
   - Frontend: Netlify Production Site
   - Backend: Render Production Service (Docker)
   - Database: Supabase Production Project

3. **`testing`** (PRs para `dev` ou `main`)
   - Usado apenas para testes no CI/CD
   - PostgreSQL temporário no GitHub Actions

### 📝 Configurar Environments no GitHub

1. Vá para o repositório no GitHub
2. Clique em **Settings** > **Environments**
3. Clique em **New environment**
4. Crie os 3 environments: `development`, `production`, `testing`

**Para cada environment, configure:**

#### Development Environment
- **Name**: `development`
- **Protection rules**:
  - ✅ Required reviewers: 0 (desenvolvimento)
  - ✅ Deployment branches: `dev` only

#### Production Environment
- **Name**: `production`
- **Protection rules**:
  - ✅ Required reviewers: 1+ (segurança)
  - ✅ Deployment branches: `main` only
  - ✅ Wait timer: 5 minutes (opcional)

#### Testing Environment
- **Name**: `testing`
- **Protection rules**: Nenhuma (apenas para testes)

---

## 🎯 Secrets Necessários

### 🔧 Secrets do Repository (Compartilhados)

Configure em: **Settings** > **Secrets and variables** > **Actions** > **Repository secrets**

| Secret Name | Descrição | Como Obter |
|------------|-----------|------------|
| `NETLIFY_AUTH_TOKEN` | Token de autenticação Netlify | [netlify.com/user/applications](https://app.netlify.com/user/applications) |
| `GITHUB_TOKEN` | Token do GitHub (automático) | Fornecido automaticamente pelo GitHub |

### 🌱 Secrets do Environment: `development`

Configure em: **Settings** > **Environments** > **development** > **Environment secrets**

| Secret Name | Descrição | Como Obter | Exemplo |
|------------|-----------|------------|---------|
| `SUPABASE_DB_URL_DEV` | URL JDBC do Supabase DEV | Supabase Project > Database > Connection string (adicione `jdbc:`) | `jdbc:postgresql://db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_DB_USER_DEV` | Usuário do banco DEV | Supabase Project > Database | `postgres` |
| `SUPABASE_DB_PASSWORD_DEV` | Senha do banco DEV | Supabase Project > Database Password | `[YOUR_STRONG_PASSWORD_HERE]` |
| `BACKEND_DEPLOY_HOOK_URL_DEV` | Webhook do Render DEV | Render Service > Settings > Deploy Hook | `https://api.render.com/deploy/srv-xxx...` |
| `DEV_APP_URL` | URL do backend no Render DEV | Render Service URL | `https://studyhelper-backend-dev.onrender.com` |
| `API_URL_DEV` | URL da API no Render DEV (para build frontend) | Render Service URL + `/api` | `https://studyhelper-backend-dev.onrender.com/api` |
| `NETLIFY_SITE_ID_DEV` | ID do site Netlify DEV | Netlify Site Settings > General > Site ID | `[YOUR_NETLIFY_SITE_ID]` |
| `DEV_FRONTEND_URL` | URL do frontend DEV | Netlify Site URL | `https://dev-studyhelper.netlify.app` |
| `ANALYTICS_ID_DEV` | ID do Google Analytics DEV (opcional) | Google Analytics | `G-XXXXXXXXXX` |

### 🚀 Secrets do Environment: `production`

Configure em: **Settings** > **Environments** > **production** > **Environment secrets**

| Secret Name | Descrição | Como Obter | Exemplo |
|------------|-----------|------------|---------|
| `SUPABASE_DB_URL_PROD` | URL JDBC do Supabase PROD | Supabase Project > Database > Connection string (adicione `jdbc:`) | `jdbc:postgresql://db.yyy.supabase.co:5432/postgres` |
| `SUPABASE_DB_USER_PROD` | Usuário do banco PROD | Supabase Project > Database | `postgres` |
| `SUPABASE_DB_PASSWORD_PROD` | Senha do banco PROD | Supabase Project > Database Password | `[YOUR_VERY_STRONG_PASSWORD_HERE]` |
| `BACKEND_DEPLOY_HOOK_URL_PROD` | Webhook do Render PROD | Render Service > Settings > Deploy Hook | `https://api.render.com/deploy/srv-yyy...` |
| `PROD_APP_URL` | URL do backend no Render PROD | Render Service URL | `https://studyhelper-api.onrender.com` |
| `API_URL_PROD` | URL da API no Render PROD (para build frontend) | Render Service URL + `/api` | `https://studyhelper-api.onrender.com/api` |
| `NETLIFY_SITE_ID_PROD` | ID do site Netlify PROD | Netlify Site Settings > General > Site ID | `[YOUR_NETLIFY_SITE_ID_PROD]` |
| `PROD_FRONTEND_URL` | URL do frontend PROD | Netlify Site URL ou domínio customizado | `https://studyhelper.com` |
| `ANALYTICS_ID_PROD` | ID do Google Analytics PROD (opcional) | Google Analytics | `G-YYYYYYYYYY` |
| `SENTRY_DSN_PROD` | DSN do Sentry para PROD (opcional) | Sentry Project Settings | `https://xxx@sentry.io/yyy` |

---

## 🏗️ Setup dos Serviços

### 1️⃣ Database (PostgreSQL)

Você pode escolher entre várias opções de hospedagem PostgreSQL:

#### Opção A: Supabase (Recomendado)

**Criar Projeto DEV:**
1. Acesse [supabase.com](https://supabase.com)
2. Clique em **New Project**
3. Configure:
   - **Name**: `studyhelper-dev`
   - **Database Password**: Senha forte (guarde em um gerenciador de senhas!)
   - **Region**: Mais próximo dos usuários
   - **Plan**: Free (para dev)

**Obter Connection String DEV:**
1. Vá em **Project Settings** > **Database**
2. Em **Connection string** > **URI**, copie:
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
3. Converta para JDBC (adicione `jdbc:` no início):
   ```
   jdbc:postgresql://db.xxx.supabase.co:5432/postgres
   ```
4. **Guarde essa URL** - você vai configurar no Render (não no GitHub!)

**Criar Projeto PROD:**
- Repita o processo com **Name**: `studyhelper-prod`
- **Plan**: Pro (recomendado para produção)

#### Opção B: Render PostgreSQL

1. No Render, clique em **New** > **PostgreSQL**
2. Configure:
   - **Name**: `studyhelper-db-dev`
   - **Plan**: Free (para dev)
3. Após criar, copie a **Internal Database URL**

#### Opção C: Outras (ElephantSQL, AWS RDS, etc.)

Qualquer serviço PostgreSQL funciona. Você só precisa da connection string JDBC.

---

### 2️⃣ Render (Backend) - 🐳 ARQUITETURA DOCKER

> **💡 IMPORTANTE**: O Render usa Docker para rodar o backend. Temos 3 Dockerfiles:
> - `Dockerfile` - Genérico (auto-detect do Render)
> - `Dockerfile.dev` - Otimizado para desenvolvimento (usado pelo GitHub Actions para DEV)
> - `Dockerfile.prod` - Otimizado para produção (usado pelo GitHub Actions para PROD)
>
> 📖 **Documentação completa**: Veja `backend/README-DOCKER.md` para detalhes de uso.

#### Criar Web Service DEV com Docker

1. Acesse [render.com](https://render.com)
2. Clique em **New** > **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `studyhelper-backend-dev`
   - **Branch**: `dev`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** ⬅️ **IMPORTANTE: Selecione Docker!**
   - **Dockerfile Path**: `Dockerfile` (Render usará o Dockerfile genérico)
   - **Docker Build Context**: `backend` (ou deixe vazio)
   - **Docker Command**: Deixe vazio (usará o ENTRYPOINT do Dockerfile)
   - **Plan**: Free (para dev)

#### ⚠️ Desativar Auto-Deploy no Render

**IMPORTANTE**: Desative o deploy automático para usar o GitHub Actions:

1. Vá em **Settings** (do serviço criado)
2. Procure a seção **Build & Deploy**
3. Em **Auto-Deploy**, selecione **No** ou desative a opção
4. Salve as alterações

**Por quê?** O GitHub Actions vai controlar quando fazer deploy via Deploy Hook. Se deixar o auto-deploy ativo, o Render vai fazer deploy em TODOS os commits, ignorando o CI/CD.

#### Configurar Variáveis de Ambiente no Render DEV

⚠️ **IMPORTANTE**: Use as MESMAS credenciais que você configurou nos GitHub Secrets!

Em **Environment** > **Environment Variables**, adicione:

```properties
# Profile do Spring Boot
SPRING_PROFILES_ACTIVE=dev

# Database (MESMAS credenciais do GitHub Secret SUPABASE_DB_URL_DEV)
SPRING_DATASOURCE_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=[YOUR_PASSWORD_HERE]

# JWT (gere com: openssl rand -base64 32)
JWT_SECRET=[YOUR_JWT_SECRET_HERE]
JWT_EXPIRATION=86400000

# CORS (cole a URL exata do Netlify DEV)
ALLOWED_ORIGINS=https://dev-studyhelper.netlify.app

# Porta (Render usa PORT, Spring Boot usa SERVER_PORT)
PORT=8080
SERVER_PORT=8080
```

💡 **Dica**: As credenciais do banco são:
- **No GitHub**: Para workflows rodarem migrations e testes
- **No Render**: Para a aplicação conectar ao banco em runtime

🔒 **Segurança**: 
- Nunca commite senhas reais no código
- Gere senhas fortes e únicas para cada ambiente

#### Obter Deploy Hook e URL DEV

1. **Deploy Hook**: Em **Settings** > **Deploy Hook**, copie a URL
   - Configure no GitHub: `BACKEND_DEPLOY_HOOK_URL_DEV`
2. **Service URL**: No dashboard, copie a URL do serviço
   - Configure no GitHub: `DEV_APP_URL`
   - Configure no GitHub: `API_URL_DEV` (adicione `/api` no final)

#### Criar Web Service PROD com Docker

Repita o processo com:
- **Name**: `studyhelper-backend-prod`
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: **Docker** ⬆️ **IMPORTANTE: Selecione Docker!**
- **Dockerfile Path**: `Dockerfile` (Render usará o Dockerfile genérico)
- **Plan**: Starter ou Professional (recomendado para produção)
- **⚠️ Desative o Auto-Deploy** (Settings > Build & Deploy > Auto-Deploy: No)
- **Environment Variables**: Configure com credenciais do banco PROD (diferentes do DEV!)
- **Deploy Hook**: Obtenha e configure `BACKEND_DEPLOY_HOOK_URL_PROD`
- **Service URL**: Configure `PROD_APP_URL` e `API_URL_PROD`

---

### 3️⃣ Netlify (Frontend)

#### Criar Site DEV

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **Add new site** > **Import an existing project**
3. Conecte seu repositório GitHub
4. Configure:
   - **Branch to deploy**: `dev`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

#### Obter Netlify Auth Token

1. Vá em [app.netlify.com/user/applications](https://app.netlify.com/user/applications)
2. Em **Personal access tokens**, clique em **New access token**
3. Dê um nome (ex: `GitHub Actions CI/CD`)
4. Copie o token gerado
5. Configure no GitHub: `NETLIFY_AUTH_TOKEN` (repository secret)

#### Obter Site ID DEV

1. No dashboard do site, vá em **Site settings**
2. Em **General** > **Site details**, copie o **Site ID**
3. Configure no GitHub: `NETLIFY_SITE_ID_DEV`

#### Criar Site PROD

Repita o processo com:
- **Branch to deploy**: `main`
- Obtenha o **Site ID** e configure `NETLIFY_SITE_ID_PROD`

---

## 🐳 Arquitetura Docker

### 📦 Dockerfiles Disponíveis

O projeto possui 3 Dockerfiles otimizados para diferentes cenários:

#### 1. `Dockerfile` (Generic - Usado pelo Render)
- **Uso**: Auto-detect do Render
- **Características**: Multi-stage build, JRE Alpine, usuário não-root
- **Profile**: Definido via `SPRING_PROFILES_ACTIVE` no Render
- **Tamanho**: ~210MB

#### 2. `Dockerfile.dev` (Development)
- **Uso**: Desenvolvimento local e CI/CD para DEV
- **Características**: Build rápido (sem testes), ferramentas de debug
- **Profile**: `dev` pré-configurado
- **Tamanho**: ~220MB
- **Build**: `docker build -f Dockerfile.dev -t studyhelper-backend:dev .`

#### 3. `Dockerfile.prod` (Production)
- **Uso**: CI/CD para PROD (validação)
- **Características**: Build com testes, JVM otimizada, segurança máxima
- **Profile**: `prod` pré-configurado
- **Tamanho**: ~210MB
- **Build**: `docker build -f Dockerfile.prod -t studyhelper-backend:prod .`

### 🔄 Fluxo CI/CD com Docker

#### Branch DEV → Render DEV
1. ✅ Tests (JUnit + Testcontainers)
2. ✅ Build Docker Image (`Dockerfile.dev`)
3. ✅ Test Docker Image (healthcheck)
4. ✅ Migrations (Flyway)
5. 🚀 Deploy Hook → Render rebuilds com `Dockerfile`

#### Branch MAIN → Render PROD
1. ✅ Tests + Coverage
2. ✅ Build Docker Image (`Dockerfile.prod`)
3. ✅ Test Docker Image (healthcheck)
4. ✅ Migrations (Flyway)
5. 🚀 Deploy Hook → Render rebuilds com `Dockerfile`

### 📖 Documentação Completa

Para instruções detalhadas sobre uso de Docker, consulte:
- **`backend/README-DOCKER.md`** - Guia completo de Docker
- **`backend/docker-compose.yml`** - Stack local (backend + postgres + pgadmin)

---

## 🐳 Vantagens do Docker no Render

### ✅ Benefícios

1. **Controle Total**: Você define exatamente o ambiente de execução
2. **Consistência**: Mesmo ambiente em dev, staging e prod
3. **Multi-stage Build**: Imagem final leve (JRE apenas, sem JDK/Gradle)
4. **Segurança**: Imagem Alpine Linux mínima + usuário não-root
5. **Portabilidade**: Roda em qualquer lugar (local, Render, AWS, etc)

### 📊 Comparação de Tamanho

- **Sem multi-stage**: ~600MB (JDK + Gradle + código)
- **Com multi-stage**: ~200MB (JRE + JAR apenas)

---

## 🔒 Boas Práticas de Segurança

### ✅ DO (Faça)
- ✅ Use secrets do GitHub para credenciais sensíveis
- ✅ Use variáveis de ambiente no Render/Netlify para runtime
- ✅ Gere senhas fortes e únicas para cada ambiente
- ✅ Use gerenciadores de senhas
- ✅ Rotacione credenciais periodicamente
- ✅ Use diferentes credenciais para DEV e PROD
- ✅ Use imagens Docker oficiais e atualizadas
- ✅ Execute aplicação como usuário não-root no Docker

### ❌ DON'T (Não Faça)
- ❌ **NUNCA** commite credenciais reais no código
- ❌ **NUNCA** compartilhe senhas em documentação
- ❌ **NUNCA** use senhas fracas ou padrão
- ❌ **NUNCA** reutilize senhas entre ambientes
- ❌ **NUNCA** exponha secrets em logs ou mensagens de erro
- ❌ **NUNCA** execute containers Docker como root em produção

---

## 🧪 Testar Configuração

### Testar Docker Localmente

```bash
# Build da imagem
cd backend
docker build -t studyhelper-backend:dev .

# Rodar container
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/studyhelper \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e JWT_EXPIRATION=86400000 \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  studyhelper-backend:dev

# Testar
curl http://localhost:8080/actuator/health
```

### Testar Deploy no GitHub Actions

```bash
# Trigger workflow manualmente
gh workflow run deploy-dev.yml

# Ou faça um commit na branch dev
git checkout dev
git commit --allow-empty -m "test: trigger Docker CI/CD"
git push origin dev
```

Verifique os logs em: **Actions** > **Workflows**

---

## 🆘 Troubleshooting

### Erro: "Secret not found"
- Verifique se o secret está no environment correto (development/production)
- Verifique se o nome do secret está exatamente igual ao workflow

### Erro: "Database connection failed"
- Verifique se as credenciais no GitHub Secrets são as mesmas do Render
- Verifique se o banco está acessível publicamente (Supabase/Render)
- Teste a connection string localmente

### Erro: "Deploy hook failed"
- Verifique se o deploy hook URL está correto
- Verifique se o serviço no Render está ativo
- Verifique se o auto-deploy está desativado no Render

### Erro: "Docker build failed"
- Verifique se o Dockerfile está no caminho correto
- Verifique se as dependências do Gradle estão corretas
- Teste o build localmente: `docker build -t test .`

### Erro: "Container crashes on startup"
- Verifique os logs no Render dashboard
- Verifique se todas as variáveis de ambiente estão configuradas
- Teste o container localmente com as mesmas variáveis

---

## 📚 Recursos

- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Render Docker Deploys](https://render.com/docs/docker)
- [Netlify CI/CD](https://docs.netlify.com/configure-builds/overview/)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Docker Builds](https://docs.docker.com/build/building/multi-stage/)

---

## ⚠️ AVISO IMPORTANTE

**Este arquivo é um GUIA de configuração, não contém credenciais reais!**

Todos os valores entre colchetes `[YOUR_XXX_HERE]` devem ser substituídos pelas suas credenciais reais ao configurar os secrets no GitHub.

**Nunca commite credenciais reais neste repositório!**