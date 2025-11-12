# 🐳 Docker Setup - Study Helper Backend

Este guia explica como usar Docker para desenvolver e fazer deploy do backend.

## 📋 Índice

- [Arquivos Docker](#-arquivos-docker)
- [Desenvolvimento Local](#-desenvolvimento-local)
- [Build Manual](#-build-manual)
- [Deploy no Render](#-deploy-no-render)
- [Troubleshooting](#-troubleshooting)

---

## 📦 Arquivos Docker

### `Dockerfile` (Generic)
Dockerfile genérico usado pelo Render quando detecta automaticamente o projeto. Usa multi-stage build para otimizar o tamanho da imagem.

**Características:**
- ✅ Multi-stage build (build + runtime)
- ✅ Imagem Alpine Linux (leve)
- ✅ JRE apenas (sem JDK/Gradle no runtime)
- ✅ Usuário não-root (segurança)
- ✅ Healthcheck configurado
- ✅ Profile via variável de ambiente

**Uso:** Automático pelo Render

---

### `Dockerfile.dev` (Development)
Otimizado para desenvolvimento rápido com ferramentas de debugging.

**Características:**
- ✅ Build sem testes (mais rápido)
- ✅ Ferramentas de debug (curl, wget)
- ✅ Healthcheck menos rigoroso
- ✅ Profile `dev` pré-configurado
- ✅ Imagem ~220MB

**Uso:**
```bash
docker build -f Dockerfile.dev -t studyhelper-backend:dev .
docker run -p 8080:8080 studyhelper-backend:dev
```

---

### `Dockerfile.prod` (Production)
Otimizado para performance e segurança em produção.

**Características:**
- ✅ Build com testes
- ✅ JVM otimizada (G1GC, String Deduplication)
- ✅ Healthcheck rigoroso
- ✅ Profile `prod` pré-configurado
- ✅ Apenas ferramentas essenciais
- ✅ Imagem ~210MB

**Uso:**
```bash
docker build -f Dockerfile.prod -t studyhelper-backend:prod .
docker run -p 8080:8080 studyhelper-backend:prod
```

---

### `docker-compose.yml` (Full Stack Local)
Orquestra backend + PostgreSQL + PgAdmin para desenvolvimento local.

**Serviços:**
- **backend**: Aplicação Spring Boot
- **postgres**: Banco de dados PostgreSQL 16
- **pgadmin**: Interface web para gerenciar o banco

**Uso:**
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar serviços
docker-compose down

# Parar e limpar dados
docker-compose down -v
```

**Acessos:**
- Backend: http://localhost:8080
- PgAdmin: http://localhost:5050
  - Email: admin@studyhelper.com
  - Senha: admin
- PostgreSQL: localhost:5432
  - Usuário: postgres
  - Senha: postgres
  - Database: studyhelper

---

## 🚀 Desenvolvimento Local

### Opção 1: Docker Compose (Recomendado)

**1. Criar arquivo `.env` (opcional):**
```bash
# Backend
BACKEND_PORT=8080
JWT_SECRET=my-dev-secret-key
JWT_EXPIRATION=86400000
ALLOWED_ORIGINS=http://localhost:3000

# PostgreSQL
POSTGRES_DB=studyhelper
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# PgAdmin
PGADMIN_EMAIL=admin@studyhelper.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

**2. Iniciar stack completo:**
```bash
cd backend
docker-compose up -d
```

**3. Verificar logs:**
```bash
docker-compose logs -f backend
```

**4. Testar aplicação:**
```bash
curl http://localhost:8080/actuator/health
```

**5. Acessar banco de dados via PgAdmin:**
- Abra: http://localhost:5050
- Login: admin@studyhelper.com / admin
- Adicionar servidor:
  - Host: postgres
  - Port: 5432
  - Username: postgres
  - Password: postgres

---

### Opção 2: Docker Build Manual

**Build da imagem:**
```bash
cd backend
docker build -f Dockerfile.dev -t studyhelper-backend:dev .
```

**Rodar com banco H2 (em memória):**
```bash
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  studyhelper-backend:dev
```

**Rodar com PostgreSQL externo:**
```bash
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/studyhelper \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  studyhelper-backend:dev
```

---

## 🏗️ Build Manual

### Development Build

```bash
# Build
docker build -f Dockerfile.dev -t studyhelper-backend:dev .

# Run
docker run -d \
  --name studyhelper-dev \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  studyhelper-backend:dev

# Logs
docker logs -f studyhelper-dev

# Stop
docker stop studyhelper-dev
docker rm studyhelper-dev
```

---

### Production Build

```bash
# Build
docker build -f Dockerfile.prod -t studyhelper-backend:prod .

# Run
docker run -d \
  --name studyhelper-prod \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db.supabase.co:5432/postgres \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your-password \
  -e JWT_SECRET=your-strong-secret \
  -e ALLOWED_ORIGINS=https://studyhelper.com \
  studyhelper-backend:prod

# Logs
docker logs -f studyhelper-prod

# Stop
docker stop studyhelper-prod
docker rm studyhelper-prod
```

---

## 🚀 Deploy no Render

### Configuração no Render

**1. Criar Web Service:**
- Tipo: **Web Service**
- Repository: Conectar GitHub
- Branch:
  - DEV: `dev`
  - PROD: `main`
- Runtime: **Docker** ⬅️ **IMPORTANTE!**
- Dockerfile Path: `backend/Dockerfile`
- Docker Build Context: `backend`

**2. ⚠️ Desativar Auto-Deploy:**
- Settings > Build & Deploy
- Auto-Deploy: **No**
- Motivo: GitHub Actions controlará o deploy

**3. Configurar Environment Variables:**

```properties
# Profile do Spring Boot
SPRING_PROFILES_ACTIVE=prod

# Database (Supabase)
SPRING_DATASOURCE_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-strong-password

# JWT
JWT_SECRET=your-very-strong-secret-key
JWT_EXPIRATION=86400000

# CORS
ALLOWED_ORIGINS=https://studyhelper.com

# Porta (Render usa PORT, Spring Boot usa SERVER_PORT)
PORT=8080
SERVER_PORT=8080
```

**4. Obter Deploy Hook:**
- Settings > Deploy Hook
- Copiar URL
- Adicionar no GitHub Secrets:
  - `BACKEND_DEPLOY_HOOK_URL_DEV` (para dev)
  - `BACKEND_DEPLOY_HOOK_URL_PROD` (para prod)

---

### Deploy via GitHub Actions

O deploy é automático quando você faz push:

```bash
# Deploy DEV
git checkout dev
git add .
git commit -m "feat: minha feature"
git push origin dev

# Deploy PROD
git checkout main
git merge dev
git push origin main
```

**Pipeline automático:**
1. ✅ Testes unitários
2. ✅ Testes de integração (Testcontainers)
3. ✅ Code quality check
4. ✅ Build Docker image
5. ✅ Test Docker image
6. ✅ Migrations no banco
7. 🚀 Deploy no Render via webhook

---

## 🔍 Troubleshooting

### Build falha com erro de memória

```bash
# Adicionar mais memória ao Gradle no build
docker build -f Dockerfile.dev \
  --build-arg GRADLE_OPTS="-Xmx2g" \
  -t studyhelper-backend:dev .
```

---

### Container não inicia

**Verificar logs:**
```bash
docker logs studyhelper-dev
```

**Verificar variáveis de ambiente:**
```bash
docker inspect studyhelper-dev | grep -A 20 Env
```

---

### Banco de dados não conecta

**Verificar network (docker-compose):**
```bash
docker-compose exec backend ping postgres
```

**Verificar credenciais:**
```bash
docker-compose exec postgres psql -U postgres -d studyhelper
```

---

### Porta 8080 já está em uso

**Opção 1: Mudar porta local:**
```bash
docker run -p 8081:8080 studyhelper-backend:dev
```

**Opção 2: Parar processo na porta:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

---

### Rebuild sem cache

```bash
docker build --no-cache -f Dockerfile.dev -t studyhelper-backend:dev .
```

---

### Limpar imagens antigas

```bash
# Ver imagens
docker images | grep studyhelper

# Remover imagem específica
docker rmi studyhelper-backend:dev

# Remover todas as imagens não usadas
docker image prune -a
```

---

## 📊 Comparação de Tamanho

| Dockerfile | Build Time | Image Size | Use Case |
|-----------|-----------|------------|----------|
| `Dockerfile` | ~3 min | ~210MB | Render auto-detect |
| `Dockerfile.dev` | ~2 min | ~220MB | Desenvolvimento local |
| `Dockerfile.prod` | ~4 min | ~210MB | Produção otimizada |

---

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

- ✅ Multi-stage build (sem arquivos de build no runtime)
- ✅ Imagem Alpine Linux (superfície de ataque reduzida)
- ✅ Usuário não-root (`spring:spring`)
- ✅ JRE apenas (sem JDK desnecessário)
- ✅ `.dockerignore` configurado (sem credenciais)
- ✅ Healthcheck configurado
- ✅ Variáveis de ambiente para configuração

### ❌ Nunca Faça

- ❌ NUNCA inclua arquivos `.env` com credenciais reais
- ❌ NUNCA commite Dockerfiles com senhas hardcoded
- ❌ NUNCA rode containers como root em produção
- ❌ NUNCA exponha portas desnecessárias
- ❌ NUNCA use imagens não oficiais sem verificar

---

## 📚 Recursos

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Render Docker Deploy](https://render.com/docs/docker)
- [Spring Boot Docker](https://spring.io/guides/topicals/spring-boot-docker/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Precisa de ajuda?** Abra uma issue no repositório ou consulte a documentação completa em `GITHUB-SECRETS.md`.
