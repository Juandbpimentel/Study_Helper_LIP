# 🔐 Guia de Configuração - GitHub Secrets & Environments

## 📋 Visão Geral

Este guia mostra como configurar os **GitHub Environments** e **Secrets** para deploy automático via GitHub Actions.

> **⚠️ IMPORTANTE**: Este guia lista TODOS os secrets que os workflows REALMENTE usam. 
> Os nomes dos secrets aqui correspondem EXATAMENTE ao que está nos arquivos `.github/workflows/*.yml`.

### 🏗️ Arquitetura do Projeto

- **Frontend**: Netlify (https://netlify.com)
- **Backend**: Render (https://render.com)
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
   - Backend: Render Dev Service
   - Database: Supabase Dev Project

2. **`production`** (branch: `main`)
   - Frontend: Netlify Production Site
   - Backend: Render Production Service
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
| `SUPABASE_DB_PASSWORD_DEV` | Senha do banco DEV | Supabase Project > Database Password | `sua_senha_dev_123` |
| `BACKEND_DEPLOY_HOOK_URL_DEV` | Webhook do Render DEV | Render Service > Settings > Deploy Hook | `https://api.render.com/deploy/srv-xxx...` |
| `DEV_APP_URL` | URL do backend no Render DEV | Render Service URL | `https://studyhelper-backend-dev.onrender.com` |
| `API_URL_DEV` | URL da API no Render DEV (para build frontend) | Render Service URL + `/api` | `https://studyhelper-backend-dev.onrender.com/api` |
| `NETLIFY_SITE_ID_DEV` | ID do site Netlify DEV | Netlify Site Settings > General > Site ID | `abc123-def456-ghi789` |
| `DEV_FRONTEND_URL` | URL do frontend DEV | Netlify Site URL | `https://dev-studyhelper.netlify.app` |
| `ANALYTICS_ID_DEV` | ID do Google Analytics DEV (opcional) | Google Analytics | `G-XXXXXXXXXX` |

### 🚀 Secrets do Environment: `production`

Configure em: **Settings** > **Environments** > **production** > **Environment secrets**

| Secret Name | Descrição | Como Obter | Exemplo |
|------------|-----------|------------|---------|
| `SUPABASE_DB_URL_PROD` | URL JDBC do Supabase PROD | Supabase Project > Database > Connection string (adicione `jdbc:`) | `jdbc:postgresql://db.yyy.supabase.co:5432/postgres` |
| `SUPABASE_DB_USER_PROD` | Usuário do banco PROD | Supabase Project > Database | `postgres` |
| `SUPABASE_DB_PASSWORD_PROD` | Senha do banco PROD | Supabase Project > Database Password | `senha_FORTE_prod_456!` |
| `BACKEND_DEPLOY_HOOK_URL_PROD` | Webhook do Render PROD | Render Service > Settings > Deploy Hook | `https://api.render.com/deploy/srv-yyy...` |
| `PROD_APP_URL` | URL do backend no Render PROD | Render Service URL | `https://studyhelper-api.onrender.com` |
| `API_URL_PROD` | URL da API no Render PROD (para build frontend) | Render Service URL + `/api` | `https://studyhelper-api.onrender.com/api` |
| `NETLIFY_SITE_ID_PROD` | ID do site Netlify PROD | Netlify Site Settings > General > Site ID | `xyz789-uvw012-rst345` |
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
   - **Database Password**: Senha forte (guarde!)
   - **Region**: Mais próximo dos usuários
   - **Plan**: Free (para dev)

**Obter Connection String DEV:**
1. Vá em **Project Settings** > **Database**
2. Em **Connection string** > **URI**, copie:
   ```
   postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
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

### 2️⃣ Render (Backend)

#### Criar Web Service DEV

1. Acesse [render.com](https://render.com)
2. Clique em **New** > **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `studyhelper-backend-dev`
   - **Branch**: `dev`
   - **Root Directory**: `backend`
   - **Runtime**: `Java`
   - **Build Command**: `./gradlew build -x test`
   - **Start Command**: `java -jar build/libs/*.jar`
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
SPRING_DATASOURCE_PASSWORD=sua_senha_aqui

# JWT
JWT_SECRET=AbCdEf1234567890... (gere com: openssl rand -base64 32)
JWT_EXPIRATION=86400000

# CORS (cole a URL exata do Netlify DEV)
ALLOWED_ORIGINS=https://dev-studyhelper.netlify.app
```

💡 **Dica**: As credenciais do banco são:
- **No GitHub**: Para workflows rodarem migrations e testes
- **No Render**: Para a aplicação conectar ao banco em runtime

#### Obter Deploy Hook e URL DEV

1. **Deploy Hook**: Em **Settings** > **Deploy Hook**, copie a URL
   - Configure no GitHub: `BACKEND_DEPLOY_HOOK_URL_DEV`
2. **Service URL**: No dashboard, copie a URL do serviço
   - Configure no GitHub: `DEV_APP_URL`
   - Configure no GitHub: `API_URL_DEV` (adicione `/api` no final)

#### Criar Web Service PROD

Repita o processo com:
- **Name**: `studyhelper-backend-prod`
- **Branch**: `main`
- **Plan**: Starter ou Professional (recomendado)
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
   - **Build command**: `npm run build` ou `yarn build`
   - **Publish directory**: `out` ou `.next`

#### ⚠️ Desativar Auto-Deploy no Netlify

**IMPORTANTE**: Desative o deploy automático para usar o GitHub Actions:

1. Após criar o site, vá em **Site settings**
2. Navegue até **Build & deploy** > **Continuous Deployment**
3. Em **Build settings**, clique em **Edit settings**
4. Desative a opção **Builds** ou configure **Stop builds**
5. Alternativamente, em **Deploy contexts**, configure:
   - **Production branch**: None (desabilitado)
   - **Branch deploys**: None (desabilitado)
6. Salve as alterações

**Por quê?** O GitHub Actions vai fazer o deploy via Netlify CLI usando o `NETLIFY_AUTH_TOKEN`. Se deixar o auto-deploy ativo, o Netlify vai fazer build em TODOS os commits, gastando seus build minutes desnecessariamente.

#### Configurar Variáveis de Ambiente no Netlify DEV

Em **Site settings** > **Environment variables**, adicione:

```properties
NODE_ENV=development
NEXT_PUBLIC_API_URL=https://studyhelper-backend-dev.onrender.com/api
NEXT_PUBLIC_ENV=development
```

#### Obter Informações DEV

1. **Site ID**: Site settings > General > Site ID
   - Configure: `NETLIFY_SITE_ID_DEV`
2. **Site URL**: Será algo como `abc123.netlify.app`
   - Configure: `FRONTEND_URL_DEV`

#### Criar Site PROD

Repita o processo com:
- **Branch**: `main`
- **Domain**: Configure domínio customizado (opcional)
- **⚠️ Desative o Auto-Deploy** (Site settings > Build & deploy > Stop builds)

#### Obter Token de Autenticação Netlify

1. Vá em [User Settings](https://app.netlify.com/user/applications)
2. Clique em **New access token**
3. Nome: `GitHub Actions`
4. Copie o token
5. Configure: `NETLIFY_AUTH_TOKEN` (repository secret)

---

## 📋 Checklist de Configuração Completo

### ✅ Repository Secrets (Compartilhados)

- [ ] `NETLIFY_AUTH_TOKEN` - Token Netlify para deploy

### ✅ Environment: `development`

**Database (Supabase):**
- [ ] `SUPABASE_DB_URL_DEV` - URL JDBC do Supabase DEV
- [ ] `SUPABASE_DB_USER_DEV` - Usuário do banco DEV
- [ ] `SUPABASE_DB_PASSWORD_DEV` - Senha do banco DEV

**Backend (Render):**
- [ ] `BACKEND_DEPLOY_HOOK_URL_DEV` - Deploy hook do Render DEV
- [ ] `DEV_APP_URL` - URL do backend no Render DEV

**Frontend (Netlify):**
- [ ] `NETLIFY_SITE_ID_DEV` - ID do site Netlify DEV
- [ ] `DEV_FRONTEND_URL` - URL do frontend DEV
- [ ] `API_URL_DEV` - URL da API para build do frontend

**Opcionais:**
- [ ] `ANALYTICS_ID_DEV` - Google Analytics DEV (opcional)

### ✅ Environment: `production`

**Database (Supabase):**
- [ ] `SUPABASE_DB_URL_PROD` - URL JDBC do Supabase PROD
- [ ] `SUPABASE_DB_USER_PROD` - Usuário do banco PROD
- [ ] `SUPABASE_DB_PASSWORD_PROD` - Senha do banco PROD

**Backend (Render):**
- [ ] `BACKEND_DEPLOY_HOOK_URL_PROD` - Deploy hook do Render PROD
- [ ] `PROD_APP_URL` - URL do backend no Render PROD

**Frontend (Netlify):**
- [ ] `NETLIFY_SITE_ID_PROD` - ID do site Netlify PROD
- [ ] `PROD_FRONTEND_URL` - URL do frontend PROD
- [ ] `API_URL_PROD` - URL da API para build do frontend

**Opcionais:**
- [ ] `ANALYTICS_ID_PROD` - Google Analytics PROD (opcional)
- [ ] `SENTRY_DSN_PROD` - Sentry DSN para monitoramento (opcional)

---

## 🔧 Como Configurar no GitHub (Passo a Passo)

### 1. Criar Environments

1. Vá para: **Settings** > **Environments**
2. Clique em **New environment**
3. Nome: `development`
4. Configure protection rules (opcional para dev)
5. Repita para `production` (com proteções)

### 2. Adicionar Repository Secrets

1. Vá para: **Settings** > **Secrets and variables** > **Actions**
2. Aba: **Secrets** > **New repository secret**
3. Adicione:
   - Nome: `NETLIFY_AUTH_TOKEN`
   - Valor: Token do Netlify

### 3. Adicionar Environment Secrets (DEV)

1. Vá para: **Settings** > **Environments** > **development**
2. Clique em **Add secret** (na seção Environment secrets)
3. Adicione CADA secret:
   - `SUPABASE_DB_URL_DEV`
   - `SUPABASE_DB_USER_DEV`
   - `SUPABASE_DB_PASSWORD_DEV`
   - `BACKEND_DEPLOY_HOOK_URL_DEV`
   - `DEV_APP_URL`
   - `API_URL_DEV`
   - `NETLIFY_SITE_ID_DEV`
   - `DEV_FRONTEND_URL`
   - `ANALYTICS_ID_DEV` (opcional)

### 4. Adicionar Environment Secrets (PROD)

1. Vá para: **Settings** > **Environments** > **production**
2. Clique em **Add secret**
3. Adicione CADA secret:
   - `SUPABASE_DB_URL_PROD`
   - `SUPABASE_DB_USER_PROD`
   - `SUPABASE_DB_PASSWORD_PROD`
   - `BACKEND_DEPLOY_HOOK_URL_PROD`
   - `PROD_APP_URL`
   - `API_URL_PROD`
   - `NETLIFY_SITE_ID_PROD`
   - `PROD_FRONTEND_URL`
   - `ANALYTICS_ID_PROD` (opcional)
   - `SENTRY_DSN_PROD` (opcional)

---

## 🧪 Testando a Configuração

### Teste 1: Push para DEV

```bash
git checkout dev
git add .
git commit -m "test: trigger dev deployment"
git push origin dev
```

**Verifique:**
1. GitHub Actions executando
2. Render fazendo deploy
3. Netlify publicando

### Teste 2: Pull Request para MAIN

```bash
git checkout -b feature/test-prod
git push origin feature/test-prod
# Abra PR para main no GitHub
```

**Verifique:**
1. Testes executando
2. Cobertura reportada
3. Aprovação necessária (se configurado)

### Teste 3: Deploy em PROD

```bash
# Após merge do PR
git checkout main
git pull origin main
```

**Verifique:**
1. GitHub Actions executando
2. Render PROD fazendo deploy
3. Netlify PROD publicando

---

## 🔐 Boas Práticas de Segurança

### ✅ Faça:

- ✅ Use **GitHub Environments** para separar DEV e PROD
- ✅ Configure **Required reviewers** para produção
- ✅ Use senhas fortes e únicas para cada ambiente
- ✅ Gere JWT secrets de 256 bits ou mais (`openssl rand -base64 32`)
- ✅ Use secrets **DIFERENTES** para DEV e PROD
- ✅ Rotacione secrets a cada 90 dias
- ✅ Limite o CORS às URLs necessárias
- ✅ Use SSL/TLS em produção (Render e Netlify já fornecem)
- ✅ Ative **Connection Pooler** no Supabase para PROD
- ✅ Use planos pagos para produção (Render Starter, Supabase Pro)

### ❌ Não Faça:

- ❌ Commitar secrets no código
- ❌ Usar a mesma senha/secret em DEV e PROD
- ❌ Compartilhar secrets via email/chat/Slack
- ❌ Usar senhas fracas em produção
- ❌ Liberar CORS para todas as origens (`*`)
- ❌ Usar planos free para produção crítica
- ❌ Expor portas desnecessárias
- ❌ Deixar logs verbosos em produção

---

## 🧪 Testando a Configuração

### Teste 1: Push para DEV

```bash
git checkout dev
git add .
git commit -m "test: trigger dev deployment"
git push origin dev
```

**Verifique:**
1. GitHub Actions executando
2. Render fazendo deploy
3. Netlify publicando

### Teste 2: Pull Request para MAIN

```bash
git checkout -b feature/test-prod
git push origin feature/test-prod
# Abra PR para main no GitHub
```

**Verifique:**
1. Testes executando
2. Cobertura reportada
3. Aprovação necessária (se configurado)

### Teste 3: Deploy em PROD

```bash
# Após merge do PR
git checkout main
git pull origin main
```

**Verifique:**
1. GitHub Actions executando
2. Render PROD fazendo deploy
3. Netlify PROD publicando

---

## 🔍 Troubleshooting

### Erro: "Environment secret not found"

**Problema**: Secret não configurado no environment correto

**Solução**:
1. Verifique se o secret está no **environment** (não no repository)
2. Vá em Settings > Environments > [environment] > Environment secrets
3. Secrets de environments são case-sensitive
4. Confirme que o workflow está usando o environment correto

### Erro: "Invalid database credentials" (Supabase)

**Problema**: Credenciais do Supabase incorretas

**Solução**:
1. Verifique se a URL está no formato JDBC:
   ```
   jdbc:postgresql://db.xxx.supabase.co:5432/postgres
   ```
2. Confirme a senha no Supabase Project Settings > Database
3. Teste a conexão localmente:
   ```bash
   psql "postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"
   ```
4. Verifique se o Connection Pooler está ativo (PROD)

### Erro: "Render deploy failed"

**Problema**: Falha no deploy do Render

**Solução**:
1. Verifique os logs no Render Dashboard
2. Confirme que o `build.gradle` está correto
3. Verifique se as variáveis de ambiente estão configuradas no Render
4. Garanta que o Flyway não está tentando conectar antes do banco estar pronto

### Erro: "Netlify deploy failed"

**Problema**: Falha no deploy do Netlify

**Solução**:
1. Verifique o `NETLIFY_SITE_ID` está correto
2. Confirme que o `NETLIFY_AUTH_TOKEN` tem permissões
3. Verifique se o `build command` e `publish directory` estão corretos
4. Confira as variáveis de ambiente no Netlify Site Settings

### Erro: "JWT signature does not match"

**Problema**: JWT secret incorreto ou diferente entre ambientes

**Solução**:
1. Gere um novo secret: `openssl rand -base64 32`
2. Atualize no GitHub Environment Secret
3. Atualize no Render Environment Variables
4. Faça um novo deploy

### Erro: "CORS policy blocked"

**Problema**: Frontend não consegue acessar o backend

**Solução**:
1. Verifique `ALLOWED_ORIGINS` no Render
2. Deve conter a URL exata do Netlify:
   ```
   https://dev-studyhelper.netlify.app
   ```
3. Sem barra `/` no final
4. Para múltiplas origens, use vírgula:
   ```
   https://studyhelper.com,https://www.studyhelper.com
   ```

---

## 📖 Exemplos de Configuração

### Exemplo Completo: Development

**Database DEV (Supabase):**
```properties
Project: studyhelper-dev
Region: South America (São Paulo)
Connection String: postgresql://postgres:sua_senha_dev_123@db.abcdefghijk.supabase.co:5432/postgres
JDBC URL: jdbc:postgresql://db.abcdefghijk.supabase.co:5432/postgres
```

**GitHub Secrets (Environment: development):**
```properties
# Database (para workflows rodarem migrations e testes)
SUPABASE_DB_URL_DEV=jdbc:postgresql://db.abcdefghijk.supabase.co:5432/postgres
SUPABASE_DB_USER_DEV=postgres
SUPABASE_DB_PASSWORD_DEV=sua_senha_dev_123

# Backend Deploy
BACKEND_DEPLOY_HOOK_URL_DEV=https://api.render.com/deploy/srv-abc123
DEV_APP_URL=https://studyhelper-backend-dev.onrender.com
API_URL_DEV=https://studyhelper-backend-dev.onrender.com/api

# Frontend
NETLIFY_SITE_ID_DEV=abc123-def456-ghi789
DEV_FRONTEND_URL=https://dev-studyhelper.netlify.app
```

**Render DEV:**
```properties
Service: studyhelper-backend-dev
Plan: Free
URL: https://studyhelper-backend-dev.onrender.com

⚠️ Environment Variables no Render (MESMAS credenciais do GitHub):
SPRING_PROFILES_ACTIVE=dev
SPRING_DATASOURCE_URL=jdbc:postgresql://db.abcdefghijk.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=sua_senha_dev_123
JWT_SECRET=AbCdEf1234567890...
JWT_EXPIRATION=86400000
ALLOWED_ORIGINS=https://dev-studyhelper.netlify.app
```

**Netlify DEV:**
```properties
Site: studyhelper-dev
URL: https://dev-studyhelper.netlify.app

Environment Variables no Netlify:
NODE_ENV=development
NEXT_PUBLIC_API_URL=https://studyhelper-backend-dev.onrender.com/api
NEXT_PUBLIC_ENV=development

GitHub Secrets:
NETLIFY_SITE_ID_DEV=abc123-def456-ghi789
FRONTEND_URL_DEV=https://dev-studyhelper.netlify.app
```

### Exemplo Completo: Production

**Database PROD (Supabase Pro):**
```properties
Project: studyhelper-prod
Region: South America (São Paulo)
Plan: Pro ($25/mês)
Connection Pooler: Habilitado
Connection String: postgresql://postgres:SENHA_FORTE@db.xyzuvw987.supabase.co:5432/postgres
JDBC URL: jdbc:postgresql://db.xyzuvw987.supabase.co:5432/postgres
```

**GitHub Secrets (Environment: production):**
```properties
# Database (para workflows rodarem migrations e testes)
SUPABASE_DB_URL_PROD=jdbc:postgresql://db.xyzuvw987.supabase.co:5432/postgres
SUPABASE_DB_USER_PROD=postgres
SUPABASE_DB_PASSWORD_PROD=SENHA_MUITO_FORTE_PROD_456!@#

# Backend Deploy
BACKEND_DEPLOY_HOOK_URL_PROD=https://api.render.com/deploy/srv-xyz789
PROD_APP_URL=https://studyhelper-api.onrender.com
API_URL_PROD=https://studyhelper-api.onrender.com/api

# Frontend
NETLIFY_SITE_ID_PROD=xyz789-uvw012-rst345
PROD_FRONTEND_URL=https://studyhelper.com
```

**Render PROD:**
```properties
Service: studyhelper-backend-prod
Plan: Starter ($7/mês) ou Professional ($25/mês)
URL: https://studyhelper-api.onrender.com
Custom Domain: api.studyhelper.com (opcional)

⚠️ Environment Variables no Render (MESMAS credenciais do GitHub):
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://db.xyzuvw987.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=SENHA_MUITO_FORTE_PROD_456!@#
JWT_SECRET=XyZ9876543210AbCdEf...
JWT_EXPIRATION=86400000
ALLOWED_ORIGINS=https://studyhelper.com,https://www.studyhelper.com
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=5
```

**Netlify PROD:**
```properties
Site: studyhelper-prod
URL: https://studyhelper.com
Custom Domain: studyhelper.com

Environment Variables no Netlify:
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://studyhelper-api.onrender.com/api
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/... (opcional)

GitHub Secrets:
NETLIFY_SITE_ID_PROD=xyz789-uvw012-rst345
FRONTEND_URL_PROD=https://studyhelper.com
```

---

## 📊 Matriz de Configuração Completa

| Componente | Local | DEV | PROD |
|------------|-------|-----|------|
| **Frontend** | localhost:3000 | Netlify Dev | Netlify Prod + Domínio |
| **Backend** | localhost:8080 | Render Free | Render Starter/Pro |
| **Database** | Docker/Local | Supabase Free | Supabase Pro |
| **Profile** | `dev` | `dev` | `prod` |
| **SSL** | Não | Sim (auto) | Sim (auto) |
| **CORS** | localhost | Netlify Dev URL | Domínio Prod |
| **Logging** | INFO/DEBUG | INFO/DEBUG | WARN/INFO |
| **JWT Secret** | Simples | Médio | Forte (256+ bits) |
| **Connection Pool** | Padrão | Padrão | Otimizado (10/5) |
| **Backups** | Não | Manual | Automático (Supabase) |
| **Monitoramento** | Não | Logs básicos | Sentry + Logs |

---

## 💰 Custos Estimados

### Development (Free Tier)
- **Supabase**: Free (500MB DB, 2GB bandwidth)
- **Render**: Free (750h/mês, sleep após 15min inatividade)
- **Netlify**: Free (100GB bandwidth, 300 build minutes)
- **Total**: $0/mês

### Production (Recommended)
- **Supabase Pro**: $25/mês (8GB DB, 50GB bandwidth, backups diários)
- **Render Starter**: $7/mês (512MB RAM, sem sleep)
- **Netlify Pro**: $19/mês (400GB bandwidth, domínio customizado)
- **Total**: ~$51/mês

**Alternativas mais baratas para PROD:**
- Render Free + Supabase Free: $0 (limitações de performance)
- Render Starter + Supabase Free: $7/mês (boa opção inicial)
- Usar apenas um domínio Netlify: $0 (sem domínio customizado)

---

## 🔄 Rotação de Secrets

### Quando Rotacionar:

- 📅 A cada 90 dias (recomendado)
- ⚠️ Quando houver suspeita de vazamento
- 👤 Quando um desenvolvedor sair da equipe
- 🔐 Após incidentes de segurança
- 🔄 Ao mudar de plano (Free → Paid)

### Como Rotacionar:

#### 1. JWT Secrets

```bash
# Gere novo secret
openssl rand -base64 32

# Atualize no GitHub Environment
Settings > Environments > [env] > Edit Secret

# Atualize no Render
Dashboard > Service > Environment > Edit Variable

# Faça deploy
git push origin [branch]
```

#### 2. Database Password (Supabase)

```bash
# 1. Gere nova senha no Supabase
Project Settings > Database > Reset Database Password

# 2. Atualize no GitHub Environment
SUPABASE_DB_PASSWORD_[ENV]

# 3. Atualize no Render
SPRING_DATASOURCE_PASSWORD

# 4. Redeploy imediato
```

#### 3. Netlify Token

```bash
# 1. Revogue o token antigo
User Settings > Applications > Revoke

# 2. Gere novo token
Create New Access Token

# 3. Atualize no GitHub
Repository Secret: NETLIFY_AUTH_TOKEN
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **GitHub Actions**: [Using secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- **GitHub Environments**: [Deployment environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- **Supabase**: [Database Credentials](https://supabase.com/docs/guides/database/connecting-to-postgres)
- **Render**: [Environment Variables](https://render.com/docs/environment-variables)
- **Netlify**: [Build Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- **Spring Boot**: [Externalized Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)

### Tutoriais Úteis

- [Supabase + Spring Boot Integration](https://supabase.com/docs/guides/getting-started/tutorials)
- [Deploy Spring Boot on Render](https://render.com/docs/deploy-spring-boot)
- [Deploy Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [GitHub Actions CI/CD Best Practices](https://docs.github.com/en/actions/guides)

### Ferramentas de Segurança

- **OWASP**: [Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- **Git Secrets**: [Scan for secrets](https://github.com/awslabs/git-secrets)
- **TruffleHog**: [Find credentials](https://github.com/trufflesecurity/truffleHog)
- **GitHub Secret Scanning**: Habilitado automaticamente

---

## ✅ Checklist Final

Antes de fazer deploy em produção:

### Infraestrutura
- [ ] Supabase PROD criado e configurado
- [ ] Render PROD service criado
- [ ] **Render Auto-Deploy desativado** (Settings > Build & Deploy > Auto-Deploy: No)
- [ ] Netlify PROD site criado
- [ ] **Netlify Auto-Deploy desativado** (Site settings > Build & deploy > Stop builds)
- [ ] Domínio customizado configurado (opcional)
- [ ] SSL/TLS ativo (automático no Render/Netlify)

### GitHub
- [ ] Environments criados (development, production)
- [ ] Repository secrets configurados
- [ ] Environment secrets DEV configurados
- [ ] Environment secrets PROD configurados
- [ ] Protection rules ativas em PROD
- [ ] Workflows testados em DEV

### Segurança
- [ ] JWT secrets fortes (256+ bits)
- [ ] Senhas diferentes entre DEV e PROD
- [ ] CORS limitado às URLs necessárias
- [ ] Logs apropriados (WARN/INFO em PROD)
- [ ] Connection pool otimizado
- [ ] Backups automáticos ativados (Supabase Pro)

### Testes
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Deploy em DEV funcionando
- [ ] Frontend conectando ao backend
- [ ] Database migrations executando
- [ ] Aplicação acessível via HTTPS

### Monitoramento
- [ ] Logs configurados no Render
- [ ] Métricas disponíveis no Supabase
- [ ] Alertas configurados (opcional)
- [ ] Sentry integrado (opcional)

---

**Última atualização**: 11/11/2025  
**Autor**: Juandbpimentel

**Stack Utilizada**:
- Frontend: Next.js + Netlify
- Backend: Spring Boot + Render
- Database: PostgreSQL + Supabase
- CI/CD: GitHub Actions
