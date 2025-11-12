# Backend - Study Helper 🚀

API REST com Spring Boot 3 e Java 21.

## Quick Start

```bash
docker-compose up -d
./gradlew bootRun
```

**Acesso:** http://localhost:8080

## Estrutura

```
backend/
├── src/main/
│   ├── java/com/studyhelper/backend/
│   │   └── users/               # Módulo de usuários
│   └── resources/
│       ├── application.properties
│       └── db/migration/        # Flyway migrations
├── src/test/                    # Testes unitários (H2)
├── src/integrationTest/         # Testes de integração (PostgreSQL)
└── docker-compose.yml           # PostgreSQL + PgAdmin
```

## Comandos

```bash
# Desenvolvimento
./gradlew bootRun

# Testes
./gradlew test                   # Unitários (rápido)
./gradlew integrationTest        # Integração (completo)

# Database
docker-compose up -d             # Iniciar
docker-compose down -v           # Limpar
./gradlew flywayMigrate          # Aplicar migrations

# Build
./gradlew build
./gradlew clean build
```

## Database

**PostgreSQL:** `localhost:5432`
- Database: `studyhelper`
- User/Pass: `postgres/postgres`

**PgAdmin:** http://localhost:5050
- Email: `admin@studyhelper.com`
- Senha: `admin`

## Tecnologias

- Java 21 LTS
- Spring Boot 3.2
- PostgreSQL 16
- Flyway (migrations)
- JUnit 5 + Testcontainers
- Gradle 8.5+

## CI/CD

Workflows automáticos em `.github/workflows/`:
- ✅ Testes em PRs
- ✅ Deploy em `dev` e `main`
- ✅ Migrations no Supabase

**Secrets:** Configurados no GitHub (veja [GITHUB-SECRETS.md](GITHUB-SECRETS.md))

## Troubleshooting

```bash
# Banco não conecta
docker-compose restart

# Porta 8080 ocupada
netstat -ano | findstr :8080

# Limpar cache
./gradlew clean --refresh-dependencies
```

## Docs

- [README-PROPERTIES.md](src/main/resources/README-PROPERTIES.md) - Configurações
- [GITHUB-SECRETS.md](GITHUB-SECRETS.md) - Setup CI/CD
