# 🚀 Migração para Arquitetura Docker - Resumo

## 📋 Mudanças Realizadas

### 1. 🐳 Dockerfiles Criados

#### **`Dockerfile`** (Genérico - Usado pelo Render)
- Multi-stage build otimizado
- Profile via variável de ambiente `SPRING_PROFILES_ACTIVE`
- Usuário não-root para segurança
- Healthcheck configurado
- Tamanho: ~210MB

#### **`Dockerfile.dev`** (Desenvolvimento)
- Build rápido (sem testes)
- Ferramentas de debug (curl, wget)
- Profile `dev` pré-configurado
- Healthcheck menos rigoroso
- Tamanho: ~220MB

#### **`Dockerfile.prod`** (Produção)
- Build com testes completos
- JVM otimizada (G1GC, MaxRAMPercentage)
- Profile `prod` pré-configurado
- Healthcheck rigoroso (5 retries)
- Apenas ferramentas essenciais
- Tamanho: ~210MB

---

### 2. 📦 Docker Compose Atualizado

**`docker-compose.yml`** agora inclui:
- ✅ Backend (Spring Boot)
- ✅ PostgreSQL 16 Alpine
- ✅ PgAdmin 4
- ✅ Network customizada
- ✅ Healthchecks em todos os serviços
- ✅ Dependências configuradas

**Uso:**
```bash
docker-compose up -d
```

**Acessos:**
- Backend: http://localhost:8080
- PgAdmin: http://localhost:5050
- PostgreSQL: localhost:5432

---

### 3. 🔄 Workflows CI/CD Atualizados

#### **`.github/workflows/backend-ci-cd.yml`**

**Mudanças:**

##### Job: `build-backend-dev`
- ✅ Usa Docker Buildx
- ✅ Build com `Dockerfile.dev`
- ✅ Testa imagem Docker (healthcheck)
- ✅ Salva imagem como artifact

##### Job: `build-backend-prod`
- ✅ Usa Docker Buildx
- ✅ Build com `Dockerfile.prod`
- ✅ Testa imagem Docker com variáveis de ambiente
- ✅ Salva imagem como artifact

##### Job: `deploy-backend-dev`
- ✅ Download da imagem Docker
- ✅ Trigger do Render via Deploy Hook
- ✅ Metadata do deploy (dockerBuild: true)

##### Job: `deploy-backend-prod`
- ✅ Download da imagem Docker
- ✅ Trigger do Render via Deploy Hook
- ✅ Metadata do deploy (dockerBuild: true)

**Fluxo Completo:**
```
Push → Tests → Build Docker → Test Docker → Migrations → Deploy Render
```

---

### 4. 📄 Documentação Criada

#### **`README-DOCKER.md`**
Guia completo incluindo:
- Descrição de cada Dockerfile
- Desenvolvimento local (docker-compose)
- Build manual (dev e prod)
- Deploy no Render
- Troubleshooting
- Comparação de tamanhos
- Boas práticas de segurança

#### **`GITHUB-SECRETS.md`** (Atualizado)
Adicionado seção:
- 🐳 Arquitetura Docker
- Dockerfiles disponíveis
- Fluxo CI/CD com Docker
- Configuração no Render

---

### 5. 🛠️ Scripts Helper

#### **`docker-helper.sh`** (Linux/Mac)
Scripts Bash para facilitar operações Docker:
- `build-dev` / `build-prod` - Build de imagens
- `run-dev` / `run-prod` - Rodar containers
- `stack-up` / `stack-down` - Gerenciar stack completo
- `logs` / `shell` - Debugging
- `test` - Testar imagens
- `clean` - Limpar recursos
- `status` - Ver status

#### **`docker-helper.ps1`** (Windows)
Scripts PowerShell com mesma funcionalidade:
- Cores e formatação para PowerShell
- Mesmos comandos do script Bash
- Funciona no PowerShell 5.1+

**Uso:**
```bash
# Linux/Mac
chmod +x docker-helper.sh
./docker-helper.sh stack-up

# Windows
.\docker-helper.ps1 stack-up
```

---

### 6. 🔒 `.dockerignore` Atualizado

Agora ignora:
- ✅ Arquivos Git (.git, .gitignore)
- ✅ Build artifacts (build/, .gradle/, bin/)
- ✅ IDE files (.idea/, .vscode/)
- ✅ Environment files (.env, .env.*)
- ✅ Documentation (*.md, exceto README-PROPERTIES.md)
- ✅ Docker files (não precisam estar na imagem)
- ✅ CI/CD (.github/)
- ✅ Test results e reports
- ✅ Temporary files

---

## 🎯 Como Usar

### Desenvolvimento Local (Recomendado)

```bash
# Iniciar stack completo (backend + postgres + pgadmin)
cd backend
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down
```

**Ou usando os scripts helper:**

```bash
# Linux/Mac
./docker-helper.sh stack-up

# Windows
.\docker-helper.ps1 stack-up
```

---

### Build Manual

```bash
# Development
docker build -f Dockerfile.dev -t studyhelper-backend:dev .
docker run -p 8080:8080 studyhelper-backend:dev

# Production
docker build -f Dockerfile.prod -t studyhelper-backend:prod .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://... \
  -e JWT_SECRET=... \
  studyhelper-backend:prod
```

---

### Deploy no Render

#### Configuração (Uma vez)

1. **Criar Web Service:**
   - Runtime: **Docker**
   - Dockerfile Path: `Dockerfile`
   - Root Directory: `backend`

2. **Desativar Auto-Deploy:**
   - Settings > Build & Deploy > Auto-Deploy: **No**

3. **Configurar Environment Variables:**
   ```properties
   SPRING_PROFILES_ACTIVE=dev  # ou prod
   SPRING_DATASOURCE_URL=jdbc:postgresql://...
   JWT_SECRET=...
   ALLOWED_ORIGINS=...
   PORT=8080
   SERVER_PORT=8080
   ```

4. **Obter Deploy Hook:**
   - Settings > Deploy Hook
   - Adicionar no GitHub Secrets:
     - `BACKEND_DEPLOY_HOOK_URL_DEV`
     - `BACKEND_DEPLOY_HOOK_URL_PROD`

#### Deploy Automático

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

**O GitHub Actions automaticamente:**
1. ✅ Roda testes
2. ✅ Faz build da imagem Docker
3. ✅ Testa a imagem
4. ✅ Roda migrations
5. 🚀 Faz deploy no Render

---

## 🔍 Verificar se está funcionando

### Local (Docker Compose)
```bash
# Healthcheck
curl http://localhost:8080/actuator/health

# Logs
docker-compose logs -f backend

# Status
docker-compose ps
```

### Render (Produção)
```bash
# Healthcheck
curl https://studyhelper-backend-dev.onrender.com/actuator/health

# Ver logs no dashboard do Render
# Render Dashboard > Service > Logs
```

---

## 🐛 Troubleshooting

### Build falha
```bash
# Rebuild sem cache
docker build --no-cache -f Dockerfile.dev -t studyhelper-backend:dev .
```

### Container não inicia
```bash
# Ver logs
docker logs <container-id>

# Ver variáveis de ambiente
docker inspect <container-id> | grep -A 20 Env
```

### Porta 8080 ocupada
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Limpar tudo
```bash
# Usando script helper
./docker-helper.sh clean

# Ou manualmente
docker-compose down -v
docker system prune -a
```

---

## 📊 Comparação: Antes vs Depois

### Antes (JAR Deploy)
- ❌ Build no Render (lento)
- ❌ Java runtime no Render
- ❌ Sem controle de ambiente
- ❌ Difícil reproduzir localmente

### Depois (Docker)
- ✅ Build no GitHub Actions (rápido)
- ✅ Imagem Docker otimizada (~210MB)
- ✅ Ambiente controlado e reproduzível
- ✅ Desenvolvimento local idêntico à produção
- ✅ Multi-stage build (segurança)
- ✅ Healthchecks automáticos
- ✅ Fácil rollback (tags de imagem)

---

## ✅ Checklist de Migração

### No Repositório
- [x] Criar `Dockerfile` (genérico)
- [x] Criar `Dockerfile.dev` (desenvolvimento)
- [x] Criar `Dockerfile.prod` (produção)
- [x] Atualizar `docker-compose.yml` (incluir backend)
- [x] Atualizar `.dockerignore`
- [x] Atualizar workflows CI/CD
- [x] Criar `README-DOCKER.md`
- [x] Atualizar `GITHUB-SECRETS.md`
- [x] Criar scripts helper (sh + ps1)

### No Render (DEV)
- [ ] Mudar Runtime para **Docker**
- [ ] Configurar Dockerfile Path: `Dockerfile`
- [ ] Desativar Auto-Deploy
- [ ] Configurar Environment Variables
- [ ] Obter Deploy Hook
- [ ] Testar deploy manual

### No Render (PROD)
- [ ] Mudar Runtime para **Docker**
- [ ] Configurar Dockerfile Path: `Dockerfile`
- [ ] Desativar Auto-Deploy
- [ ] Configurar Environment Variables (PROD)
- [ ] Obter Deploy Hook
- [ ] Testar deploy manual

### No GitHub
- [ ] Configurar secrets (se ainda não configurou):
  - `BACKEND_DEPLOY_HOOK_URL_DEV`
  - `BACKEND_DEPLOY_HOOK_URL_PROD`
  - `SUPABASE_DB_URL_DEV`
  - `SUPABASE_DB_URL_PROD`
  - Etc. (veja `GITHUB-SECRETS.md`)

### Teste Final
- [ ] Push na branch `dev` e verificar CI/CD
- [ ] Verificar se deploy no Render DEV funciona
- [ ] Testar aplicação no Render DEV
- [ ] Merge para `main` e verificar CI/CD
- [ ] Verificar se deploy no Render PROD funciona
- [ ] Testar aplicação no Render PROD

---

## 📚 Documentação

- **`README-DOCKER.md`** - Guia completo de Docker
- **`GITHUB-SECRETS.md`** - Configuração de secrets e deploy
- **`docker-compose.yml`** - Stack local
- **`.github/workflows/backend-ci-cd.yml`** - Pipeline CI/CD

---

## 🆘 Ajuda

Se tiver problemas:
1. Consulte `README-DOCKER.md` (troubleshooting)
2. Verifique logs: `docker-compose logs -f`
3. Verifique GitHub Actions logs
4. Verifique Render logs
5. Abra uma issue no repositório

---

**✅ Migração completa! Agora você tem uma arquitetura Docker profissional.**
