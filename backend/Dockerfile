# ========================================
# Dockerfile - Generic (Render Auto-Detect)
# Study Helper Backend
# ========================================
# Este Dockerfile é usado quando o Render 
# detecta automaticamente o projeto Docker.
# Para ambientes específicos, use:
# - Dockerfile.dev (desenvolvimento)
# - Dockerfile.prod (produção)
# ========================================

# Stage 1: Build
FROM gradle:9.1.0-jdk21-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração do Gradle
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle

# Copiar código fonte
COPY src ./src

# Build da aplicação (sem testes para build mais rápido)
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Criar usuário não-root para segurança
RUN addgroup -S spring && adduser -S spring -G spring

# Copiar o JAR do stage de build
COPY --from=builder /app/build/libs/*.jar app.jar

# Dar permissões ao usuário spring
RUN chown -R spring:spring /app

USER spring:spring

# Expor porta 8080
EXPOSE 8080

# Healthcheck para o Render saber se a aplicação está saudável
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Comando para executar a aplicação
# O profile é definido via variável de ambiente SPRING_PROFILES_ACTIVE no Render
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", \
  "app.jar"]