# 🚀 Quick Start - Docker Backend

## 🏃 Início Rápido (5 minutos)

### 1️⃣ Desenvolvimento Local

```powershell
# Abrir terminal no diretório backend
cd backend

# Iniciar stack completo (backend + postgres + pgadmin)
docker-compose up -d

# Aguardar ~30 segundos para iniciar

# Verificar se está funcionando
curl http://localhost:8080/actuator/health
```

**Pronto!** ✅ Backend rodando em http://localhost:8080

---

### 2️⃣ Acessos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Backend** | http://localhost:8080 | - |
| **PgAdmin** | http://localhost:5050 | admin@studyhelper.com / admin |
| **PostgreSQL** | localhost:5432 | postgres / postgres |

---

### 3️⃣ Comandos Úteis

```powershell
# Ver logs do backend
docker-compose logs -f backend

# Reiniciar apenas o backend
docker-compose restart backend

# Parar tudo
docker-compose down

# Parar e limpar dados
docker-compose down -v

# Ver status
docker-compose ps
```

---

### 4️⃣ Usando Scripts Helper (Opcional)

```powershell
# Windows PowerShell
.\docker-helper.ps1 stack-up      # Iniciar
.\docker-helper.ps1 logs          # Ver logs
.\docker-helper.ps1 stack-down    # Parar
.\docker-helper.ps1 help          # Ver todos os comandos

# Linux/Mac (Git Bash)
chmod +x docker-helper.sh
./docker-helper.sh stack-up       # Iniciar
./docker-helper.sh logs           # Ver logs
./docker-helper.sh stack-down     # Parar
./docker-helper.sh help           # Ver todos os comandos
```

---

## 🔧 Configurar Render (Uma vez)

### DEV Environment

1. **Criar Web Service no Render:**
   - New > Web Service
   - Conectar GitHub
   - Branch: `dev`
   - Root Directory: `backend`
   - Runtime: **Docker** ⬅️ **IMPORTANTE!**

2. **Desativar Auto-Deploy:**
   - Settings > Build & Deploy
   - Auto-Deploy: **No**

3. **Configurar Environment Variables:**
   ```properties
   SPRING_PROFILES_ACTIVE=dev
   SPRING_DATASOURCE_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=[sua-senha]
   JWT_SECRET=[gere-um-secret]
   ALLOWED_ORIGINS=https://seu-frontend-dev.netlify.app
   PORT=8080
   SERVER_PORT=8080
   ```

4. **Obter Deploy Hook:**
   - Settings > Deploy Hook
   - Copiar URL
   - GitHub > Settings > Secrets > Environments > development
   - Adicionar: `BACKEND_DEPLOY_HOOK_URL_DEV`

5. **Obter Service URL:**
   - Copiar URL do serviço (ex: https://studyhelper-backend-dev.onrender.com)
   - GitHub > Settings > Secrets > Environments > development
   - Adicionar: `DEV_APP_URL`

### PROD Environment

Repetir os mesmos passos mas com:
- Branch: `main`
- Environment: `production`
- Secrets: `BACKEND_DEPLOY_HOOK_URL_PROD`, `PROD_APP_URL`
- Credenciais PROD (diferentes das DEV!)

---

## 📋 Checklist de Setup

### Primeira vez (apenas uma vez)

#### Local
- [ ] Instalar Docker Desktop
- [ ] Clonar repositório
- [ ] Abrir terminal em `backend/`
- [ ] Executar `docker-compose up -d`
- [ ] Testar: http://localhost:8080/actuator/health

#### Render DEV
- [ ] Criar Web Service (Runtime: Docker)
- [ ] Desativar Auto-Deploy
- [ ] Configurar Environment Variables
- [ ] Obter Deploy Hook → GitHub Secret
- [ ] Obter Service URL → GitHub Secret

#### Render PROD
- [ ] Criar Web Service (Runtime: Docker)
- [ ] Desativar Auto-Deploy
- [ ] Configurar Environment Variables (PROD)
- [ ] Obter Deploy Hook → GitHub Secret
- [ ] Obter Service URL → GitHub Secret

#### GitHub
- [ ] Configurar todos os secrets (veja `GITHUB-SECRETS.md`)

---

## 🔄 Workflow Diário

### Desenvolvimento

```powershell
# 1. Iniciar ambiente local
cd backend
docker-compose up -d

# 2. Desenvolver código...

# 3. Testar localmente
curl http://localhost:8080/actuator/health

# 4. Commit e push
git add .
git commit -m "feat: minha feature"
git push origin dev

# 5. GitHub Actions automaticamente:
#    - Roda testes
#    - Faz build Docker
#    - Testa imagem
#    - Roda migrations
#    - Faz deploy no Render DEV

# 6. Verificar deploy
# Aguardar ~5 minutos
curl https://studyhelper-backend-dev.onrender.com/actuator/health
```

### Deploy para Produção

```powershell
# 1. Merge dev → main
git checkout main
git merge dev
git push origin main

# 2. GitHub Actions automaticamente:
#    - Roda todos os testes
#    - Gera coverage report
#    - Faz build Docker
#    - Testa imagem
#    - Roda migrations PROD
#    - Faz deploy no Render PROD

# 3. Verificar deploy
# Aguardar ~5 minutos
curl https://studyhelper-backend-prod.onrender.com/actuator/health
```

---

## 🐛 Troubleshooting Rápido

### Backend não inicia localmente

```powershell
# Ver logs
docker-compose logs backend

# Verificar se porta está ocupada
netstat -ano | findstr :8080

# Reiniciar
docker-compose restart backend
```

### Container não conecta ao banco

```powershell
# Verificar se o postgres está rodando
docker-compose ps

# Reiniciar postgres
docker-compose restart postgres

# Ver logs do postgres
docker-compose logs postgres
```

### Build do Docker falha

```powershell
# Rebuild sem cache
docker-compose build --no-cache backend

# Ou rebuild individual
docker build --no-cache -f Dockerfile.dev -t studyhelper-backend:dev .
```

### Limpar tudo e recomeçar

```powershell
# Parar e remover tudo (incluindo volumes)
docker-compose down -v

# Remover imagens
docker rmi $(docker images -q studyhelper*)

# Recomeçar do zero
docker-compose up -d --build
```

---

## 📚 Documentação Completa

Precisa de mais detalhes? Consulte:

- **`DOCKER-MIGRATION.md`** - Resumo completo da migração
- **`README-DOCKER.md`** - Guia detalhado de Docker
- **`GITHUB-SECRETS.md`** - Configuração de secrets e deploy
- **`docker-compose.yml`** - Configuração do stack local

---

## 🆘 Ajuda Rápida

### Comandos mais usados

```powershell
# Iniciar
docker-compose up -d

# Logs
docker-compose logs -f backend

# Parar
docker-compose down

# Status
docker-compose ps

# Reiniciar
docker-compose restart backend

# Limpar tudo
docker-compose down -v
```

### URLs importantes

- **Local**: http://localhost:8080
- **Health**: http://localhost:8080/actuator/health
- **PgAdmin**: http://localhost:5050
- **Render Dev**: https://studyhelper-backend-dev.onrender.com
- **Render Prod**: https://studyhelper-backend-prod.onrender.com

---

**🎉 Pronto! Você está usando Docker como um profissional!**

Para mais detalhes, consulte a documentação completa nos arquivos mencionados acima.
