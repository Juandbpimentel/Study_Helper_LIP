# Configuração do Backend - Study Helper

## 🎯 Filosofia Simplificada

**Você NÃO precisa se preocupar com múltiplos ambientes!**

- Para **desenvolvimento local**: apenas rode `./gradlew bootRun` 🚀
- Para **CI/CD e produção**: os workflows do GitHub Actions cuidam de tudo 🤖

## 📁 Arquivos de Configuração

### `application.properties` (Principal)
- Único arquivo de configuração que você precisa
- Valores padrão funcionam para desenvolvimento local
- CI/CD injeta variáveis de ambiente conforme necessário

### `application-test.properties` (Testes Unitários)
- Usado automaticamente pelos testes unitários
- Usa H2 in-memory (super rápido)
- Você não precisa mexer neste arquivo

### `application-integration-test.properties` (Testes de Integração)
- Usado pelos testes de integração
- Usa PostgreSQL via Testcontainers
- Você não precisa mexer neste arquivo

## 🚀 Como Usar

### Desenvolvimento Local

1. **Suba o banco de dados (Docker Compose)**
   ```bash
   docker-compose up -d
   ```

2. **Execute a aplicação**
   ```bash
   ./gradlew bootRun
   ```

3. **Pronto!** 🎉
   - API: http://localhost:8080
   - PgAdmin: http://localhost:5050

### Executar Testes

```bash
# Testes unitários (rápido)
./gradlew test

# Testes de integração (mais lento)
./gradlew integrationTest

# Todos os testes
./gradlew test integrationTest
```

## 🔧 Personalização (Opcional)

Se você precisar customizar alguma configuração local:

1. Copie o arquivo `.env.example` para `.env`
   ```bash
   cp .env.example .env
   ```

2. Edite o `.env` com seus valores personalizados

3. As variáveis do `.env` sobrescrevem os padrões

## 🤖 CI/CD

Os workflows em `.github/workflows/` cuidam de:
- ✅ Executar testes automaticamente
- ✅ Injetar credenciais de banco (DEV/PROD)
- ✅ Build e deploy

**Você não precisa configurar nada!** Os secrets estão no GitHub.

## ❓ FAQ

**P: Preciso criar arquivos application-dev.properties, application-prod.properties?**  
R: **NÃO!** O CI/CD injeta as variáveis de ambiente necessárias.

**P: Como o CI/CD sabe qual banco usar?**  
R: Via secrets do GitHub (`SUPABASE_DB_URL_DEV`, `SUPABASE_DB_URL_PROD`).

**P: E se eu quiser testar com outro banco localmente?**  
R: Configure no `.env` (veja seção Personalização).

**P: Posso deletar os arquivos .env.*.example?**  
R: Já foram deletados! Agora temos apenas um `.env.example` simples.

## 📚 Referências

- [Spring Boot Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
- [Flyway Migrations](https://flywaydb.org/documentation/)
- [Testcontainers](https://testcontainers.com/)
