# Study_Helper_LIP

Sistema feito para realizar gerenciamento de estudos, cronogramas e revisões para auxiliar durante a jornada universitária.

## 📋 Índice

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Testes](#testes)
- [Deploy e CI/CD](#deploy-e-cicd)
- [Documentação Adicional](#documentação-adicional)

---

## 📁 Estrutura do Projeto

Este é um monorepo contendo:

```
Study_Helper_LIP/
├── frontend/          # Aplicação Next.js
├── backend/           # API Spring Boot
└── .github/
    └── workflows/     # GitHub Actions CI/CD
```

---

## 🚀 Tecnologias

### Frontend
- **Framework**: Next.js 15 com React 19
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Gerenciador**: npm
- **Deploy**: Netlify

### Backend
- **Framework**: Spring Boot 3.2.0
- **Linguagem**: Java 21
- **Build**: Gradle 8.5+
- **Banco de Dados**: PostgreSQL 16
- **Segurança**: Spring Security + JWT
- **Migrations**: Flyway
- **Deploy**: Render

### Infraestrutura
- **Database**: Supabase (PostgreSQL managed)
- **CI/CD**: GitHub Actions
- **Containerização**: Docker & Docker Compose

---

## ✅ Pré-requisitos

### Obrigatórios:
- **Java 21** - [Download](https://adoptium.net/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/)
- **Git** - [Download](https://git-scm.com/)

### Opcionais:
- **PostgreSQL 16** (ou use Docker)
- **pgAdmin** (interface gráfica para banco)

### Verificar Instalação:
```bash
java -version        # Deve mostrar Java 21
node -version        # Deve mostrar v18+
docker --version     # Deve mostrar Docker instalado
git --version        # Deve mostrar Git instalado
```

---

## 🔧 Instalação e Configuração

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/Juandbpimentel/Study_Helper_LIP.git
cd Study_Helper_LIP
```

### 2️⃣ Configurar Backend

#### Opção A: Usar Docker (Recomendado)

```bash
cd backend

# 1. Copiar arquivo de configuração
cp .env.example .env

# 2. Iniciar PostgreSQL via Docker
docker-compose up -d

# 3. Verificar se o banco está rodando
docker-compose ps

# 4. Instalar dependências e rodar migrations
./gradlew build
./gradlew flywayMigrate

# 5. Iniciar o backend
./gradlew bootRun
```

O backend estará disponível em: **http://localhost:8080**

#### Opção B: Usar PostgreSQL Local

```bash
cd backend

# 1. Criar banco de dados
psql -U postgres
CREATE DATABASE studyhelper;
\q

# 2. Configurar .env
cp .env.example .env

# 3. Editar .env com suas credenciais
nano .env  # ou use seu editor preferido

# Configurar:
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/studyhelper
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=sua_senha

# 4. Rodar migrations e iniciar
./gradlew flywayMigrate
./gradlew bootRun
```

#### Opção C: Usar Supabase (Produção)

```bash
cd backend

# 1. Criar projeto no Supabase: https://supabase.com
# 2. Copiar credenciais do banco

# 3. Configurar .env.dev
cp .env.dev.example .env.dev

# 4. Editar com credenciais do Supabase
SPRING_DATASOURCE_URL=jdbc:postgresql://db.xxx.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=senha_supabase

# 5. Ativar profile dev e iniciar
export SPRING_PROFILES_ACTIVE=dev
./gradlew bootRun
```

### 3️⃣ Configurar Frontend

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Criar arquivo de ambiente
cp .env.example .env.local

# 3. Configurar URL do backend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local

# 4. Iniciar em modo desenvolvimento
npm run dev
```

O frontend estará disponível em: **http://localhost:3000**

---

## 💻 Desenvolvimento Local

### Fluxo Completo de Desenvolvimento

#### Terminal 1 - Backend:
```bash
cd backend

# Iniciar banco de dados
docker-compose up -d

# Rodar backend em modo watch (reinicia automaticamente)
./gradlew bootRun --continuous
```

#### Terminal 2 - Frontend:
```bash
cd frontend

# Iniciar frontend em modo desenvolvimento
npm run dev
```

#### Terminal 3 - Testes (opcional):
```bash
cd backend

# Rodar testes em modo watch
./gradlew test --continuous
```

### Acessos Locais

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8080 | - |
| PostgreSQL | localhost:5432 | postgres / postgres |
| PgAdmin | http://localhost:5050 | admin@studyhelper.com / admin |

### Comandos Úteis do Backend

```bash
cd backend

# Build completo
./gradlew build

# Testes unitários apenas
./gradlew test

# Testes de integração
./gradlew integrationTest

# Todos os testes + coverage
./gradlew test integrationTest jacocoTestReport

# Limpar build
./gradlew clean

# Verificar qualidade de código
./gradlew check

# Atualizar dependências
./gradlew dependencyUpdates

# Ver migrations aplicadas
./gradlew flywayInfo

# Limpar e recriar banco
./gradlew flywayClean flywayMigrate
```

### Comandos Úteis do Frontend

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Testar build localmente
npm run start

# Linter
npm run lint

# Corrigir problemas de lint
npm run lint -- --fix

# Type checking
npx tsc --noEmit
```

### Docker Compose - Comandos

```bash
cd backend

# Iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Parar serviços (mantém dados)
docker-compose stop

# Parar e remover containers
docker-compose down

# Remover containers E dados
docker-compose down -v

# Recriar containers
docker-compose up -d --force-recreate

# Ver status dos serviços
docker-compose ps
```

---

## 🧪 Testes

### Backend

#### Executar Todos os Testes:
```bash
cd backend
./gradlew test integrationTest
```

#### Testes por Categoria:
```bash
# Apenas testes unitários
./gradlew test --tests '*UnitTest'

# Apenas testes de integração
./gradlew integrationTest

# Teste específico
./gradlew test --tests 'UserServiceTest'

# Com relatório de cobertura
./gradlew test jacocoTestReport
```

#### Relatório de Cobertura:
```bash
./gradlew jacocoTestReport

# Abrir relatório no navegador
# Windows:
start build/reports/jacoco/test/html/index.html

# Linux/Mac:
open build/reports/jacoco/test/html/index.html
```

### Frontend

```bash
cd frontend

# Quando os testes estiverem implementados:
npm test
npm run test:coverage
```

---

## 🚀 Deploy e CI/CD

### Ambientes

| Ambiente | Branch | URL Frontend | URL Backend |
|----------|--------|--------------|-------------|
| Development | `dev` | Netlify Dev Site | Render Dev Service |
| Production | `main` | Netlify Prod Site | Render Prod Service |

### Processo de Deploy

#### Para Development:
```bash
git checkout dev
git add .
git commit -m "feat: nova funcionalidade"
git push origin dev
```

O GitHub Actions irá:
1. ✅ Rodar testes no backend
2. ✅ Rodar migrations no Supabase DEV
3. ✅ Fazer build do backend
4. ✅ Deploy no Render DEV
5. ✅ Build do frontend
6. ✅ Deploy no Netlify DEV

#### Para Production:
```bash
# 1. Criar feature branch
git checkout -b feature/minha-feature

# 2. Desenvolver e commitar
git add .
git commit -m "feat: descrição"
git push origin feature/minha-feature

# 3. Abrir Pull Request para main no GitHub

# 4. Aguardar aprovação e merge

# 5. GitHub Actions fará deploy automático em PROD
```

### Workflows Disponíveis

- **Backend CI/CD** (`.github/workflows/backend-ci-cd.yml`)
  - Testes + Build + Deploy em dev/main
  
- **Backend Test PR** (`.github/workflows/backend-test-pr.yml`)
  - Testes em Pull Requests
  
- **Frontend CI/CD** (`.github/workflows/frontend-ci-cd.yml`)
  - Build + Deploy em dev/main
  
- **Frontend Test PR** (`.github/workflows/frontend-test-pr.yml`)
  - Testes em Pull Requests

### Configurar Secrets no GitHub

Para configurar o deploy, siga o guia completo em:
📖 **[backend/GITHUB-SECRETS.md](backend/GITHUB-SECRETS.md)**

---

## 📚 Documentação Adicional

### Backend
- 📖 [GITHUB-SECRETS.md](backend/GITHUB-SECRETS.md) - Configuração de secrets e deploy
- 📖 [README-ENV.md](backend/README-ENV.md) - Guia de variáveis de ambiente
- 📖 [QUICK-START.md](backend/QUICK-START.md) - Início rápido
- 📖 [bin/main/README-PROPERTIES.md](backend/bin/main/README-PROPERTIES.md) - Configuração de properties

### Arquivos de Configuração
- `.env.example` - Desenvolvimento local (Docker)
- `.env.dev.example` - Ambiente DEV (Supabase/Render)
- `.env.prod.example` - Ambiente PROD (Supabase/Render)
- `.env.test.example` - Testes automatizados

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrão de Commits

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nova funcionalidade
fix: correção de bug
docs: alteração em documentação
style: formatação de código
refactor: refatoração
test: adição de testes
chore: tarefas de manutenção
```

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Juan Pimentel** - [@Juandbpimentel](https://github.com/Juandbpimentel)

---

## 🆘 Suporte

### Problemas Comuns

#### Backend não inicia
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Recriar containers
docker-compose down -v
docker-compose up -d
```

#### Erro de migrations
```bash
# Limpar e recriar banco
./gradlew flywayClean flywayMigrate

# Ver status das migrations
./gradlew flywayInfo
```

#### Porta já em uso
```bash
# Encontrar processo usando a porta (Windows)
netstat -ano | findstr :8080

# Matar processo (Windows)
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

#### Problemas com Docker
```bash
# Limpar tudo do Docker
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### Conseguir Ajuda

- 🐛 **Issues**: [GitHub Issues](https://github.com/Juandbpimentel/Study_Helper_LIP/issues)
- 📧 **Email**: contato através do GitHub
- 📖 **Wiki**: [GitHub Wiki](https://github.com/Juandbpimentel/Study_Helper_LIP/wiki)

---

**Feito com ❤️ para auxiliar estudantes universitários**
