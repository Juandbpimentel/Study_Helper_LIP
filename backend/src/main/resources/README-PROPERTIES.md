# Guia de Configuração - Application Properties

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquivos de Configuração](#arquivos-de-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Usar](#como-usar)

---

## 🎯 Visão Geral

Este projeto utiliza o sistema de profiles do Spring Boot para gerenciar diferentes ambientes:
- **Default**: Configurações básicas
- **DEV**: Desenvolvimento local
- **PROD**: Produção
- **TEST**: CI/CD (GitHub Actions)

---

## 📁 Arquivos de Configuração

### Estrutura de Diretórios

```
backend/src/
├── main/resources/
│   ├── application.properties                    # Configuração padrão
│   ├── application.properties.example            # Template da configuração padrão
│   ├── application-dev.properties.example        # Template para DEV
│   ├── application-prod.properties.example       # Template para PROD
│   └── application-test.properties.example       # Template para TEST
├── test/resources/
│   └── application-test.properties               # Testes unitários (H2)
└── integrationTest/resources/
    └── application-integration-test.properties   # Testes de integração (PostgreSQL + Testcontainers)
```

### 📄 application.properties
**Quando usar**: Desenvolvimento local básico sem profile específico

**Características**:
- ✅ Configurações padrão da aplicação
- ✅ Suporta variáveis de ambiente com valores default
- ✅ PostgreSQL como banco de dados
- ✅ Flyway habilitado

### 🔧 application-dev.properties
**Quando usar**: `SPRING_PROFILES_ACTIVE=dev`

**Características**:
- ✅ Debug habilitado
- ✅ SQL visível nos logs
- ✅ DevTools ativo (hot reload)
- ✅ CORS liberado para localhost:3000
- ✅ Logs em nível DEBUG

### 🚀 application-prod.properties
**Quando usar**: `SPRING_PROFILES_ACTIVE=prod`

**Características**:
- ✅ Debug desabilitado
- ✅ SQL oculto nos logs
- ✅ SSL habilitado
- ✅ Connection pool otimizado
- ✅ Logs em nível WARN/INFO
- ⚠️ **TODAS as credenciais via variáveis de ambiente**

### 🧪 application-test.properties
**Quando usar**: `SPRING_PROFILES_ACTIVE=test`

**Características**:
- ✅ PostgreSQL real (CI/CD)
- ✅ Flyway habilitado
- ✅ Usado pelo GitHub Actions
- ✅ Logs em nível INFO/DEBUG

### ⚡ application-test.properties (test/resources)
**Quando usar**: Testes unitários automáticos

**Características**:
- ✅ H2 in-memory (muito rápido)
- ✅ Flyway desabilitado
- ✅ Schema criado automaticamente pelo Hibernate
- ✅ Isolamento total entre testes

### 🐢 application-integration-test.properties
**Quando usar**: Testes de integração locais

**Características**:
- ✅ PostgreSQL via Testcontainers
- ✅ Flyway habilitado
- ✅ Testa migrations reais
- ✅ Ambiente idêntico à produção

---

## 🔐 Variáveis de Ambiente

### Padrão de Nomenclatura

**✅ PADRÃO (usar sempre)**:
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/studyhelper
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=senha123
JWT_SECRET=my-super-secret-key-256-bits
JWT_EXPIRATION=86400000
ALLOWED_ORIGINS=http://localhost:3000,https://studyhelper.com
SERVER_PORT=8080
```

**❌ NÃO USAR** (antigo):
```bash
DATABASE_URL_DEV=...
DB_USERNAME_DEV=...
DB_PASSWORD_DEV=...
```

### Variáveis Obrigatórias

#### Para DEV:
```bash
SPRING_DATASOURCE_URL (opcional, usa default)
SPRING_DATASOURCE_USERNAME (opcional, usa default)
SPRING_DATASOURCE_PASSWORD (opcional, usa default)
JWT_SECRET (opcional, usa default)
```

#### Para PROD:
```bash
SPRING_DATASOURCE_URL (OBRIGATÓRIO)
SPRING_DATASOURCE_USERNAME (OBRIGATÓRIO)
SPRING_DATASOURCE_PASSWORD (OBRIGATÓRIO)
JWT_SECRET (OBRIGATÓRIO)
JWT_EXPIRATION (opcional, padrão: 24h)
ALLOWED_ORIGINS (opcional, padrão: https://studyhelper.com)
SSL_ENABLED (opcional, padrão: false)
```

#### Para TEST (CI/CD):
```bash
SPRING_DATASOURCE_URL (definido no workflow)
SPRING_DATASOURCE_USERNAME (definido no workflow)
SPRING_DATASOURCE_PASSWORD (definido no workflow)
```

---

## 🚀 Como Usar

### 1. Setup Inicial

#### Passo 1: Copiar arquivos de exemplo
```bash
# No diretório backend/src/main/resources/
cp application.properties.example application.properties
cp application-dev.properties.example application-dev.properties
cp application-prod.properties.example application-prod.properties
cp application-test.properties.example application-test.properties
```

#### Passo 2: Configurar valores
Edite os arquivos copiados com suas credenciais reais.

⚠️ **IMPORTANTE**: Nunca commite arquivos com credenciais reais!

### 2. Executando a Aplicação

#### Desenvolvimento Local (DEV)
```bash
# Opção 1: Via variável de ambiente
export SPRING_PROFILES_ACTIVE=dev
./gradlew bootRun

# Opção 2: Via argumento
./gradlew bootRun --args='--spring.profiles.active=dev'

# Opção 3: Via IDE (IntelliJ/Eclipse)
# Configure: Run > Edit Configurations > Environment Variables
# Adicione: SPRING_PROFILES_ACTIVE=dev
```

#### Produção (PROD)
```bash
# Com variáveis de ambiente
export SPRING_PROFILES_ACTIVE=prod
export SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/studyhelper
export SPRING_DATASOURCE_USERNAME=prod_user
export SPRING_DATASOURCE_PASSWORD=super_secret_password
export JWT_SECRET=$(openssl rand -base64 32)

./gradlew bootRun
```

#### CI/CD (TEST)
O profile `test` é ativado automaticamente pelos workflows do GitHub Actions.

### 3. Executando Testes

#### Testes Unitários (H2 in-memory)
```bash
./gradlew test
```
- Usa: `src/test/resources/application-test.properties`
- Banco: H2 in-memory
- Velocidade: ⚡ Muito rápido

#### Testes de Integração (PostgreSQL + Testcontainers)
```bash
./gradlew integrationTest
```
- Usa: `src/integrationTest/resources/application-integration-test.properties`
- Banco: PostgreSQL via Testcontainers
- Velocidade: 🐢 Mais lento (mas testa ambiente real)

#### Todos os Testes
```bash
./gradlew test integrationTest
```

---

## 🔍 Troubleshooting

### Problema: "Could not connect to database"
**Solução**: Verifique se as variáveis de ambiente estão definidas corretamente.

```bash
# Verificar variáveis
echo $SPRING_DATASOURCE_URL
echo $SPRING_DATASOURCE_USERNAME

# Testar conexão com PostgreSQL
psql -h localhost -p 5432 -U your_username -d studyhelper
```

### Problema: "Invalid JWT secret"
**Solução**: O JWT secret deve ter no mínimo 256 bits (32 caracteres).

```bash
# Gerar um novo secret
openssl rand -base64 32
```

### Problema: "Flyway migration failed"
**Solução**: Execute as migrations manualmente:

```bash
./gradlew flywayMigrate
```

---

## 📚 Referências

- [Spring Boot Profiles](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles)
- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Testcontainers](https://testcontainers.com/)

---

**Última atualização**: 11/11/2025
**Autor**: Juandbpimentel
