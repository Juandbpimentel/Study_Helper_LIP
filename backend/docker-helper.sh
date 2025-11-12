#!/bin/bash
# ========================================
# Docker Helper Script
# Study Helper Backend - Development
# ========================================
# Facilita operações comuns com Docker
# Uso: ./docker-helper.sh [comando]
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
PROJECT_NAME="studyhelper-backend"
DEV_IMAGE="$PROJECT_NAME:dev"
PROD_IMAGE="$PROJECT_NAME:prod"

# Funções
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Comandos
cmd_help() {
    print_header "Docker Helper - Study Helper Backend"
    echo ""
    echo "Comandos disponíveis:"
    echo ""
    echo "  ${GREEN}build-dev${NC}          - Build imagem de desenvolvimento"
    echo "  ${GREEN}build-prod${NC}         - Build imagem de produção"
    echo "  ${GREEN}run-dev${NC}            - Rodar container de desenvolvimento"
    echo "  ${GREEN}run-prod${NC}           - Rodar container de produção"
    echo "  ${GREEN}stack-up${NC}           - Iniciar stack completo (backend + postgres + pgadmin)"
    echo "  ${GREEN}stack-down${NC}         - Parar stack completo"
    echo "  ${GREEN}stack-logs${NC}         - Ver logs do stack"
    echo "  ${GREEN}stack-restart${NC}      - Reiniciar stack completo"
    echo "  ${GREEN}logs${NC}               - Ver logs do backend"
    echo "  ${GREEN}shell${NC}              - Abrir shell no container"
    echo "  ${GREEN}test${NC}               - Testar imagem Docker"
    echo "  ${GREEN}clean${NC}              - Limpar containers e imagens"
    echo "  ${GREEN}status${NC}             - Ver status dos containers"
    echo "  ${GREEN}help${NC}               - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./docker-helper.sh build-dev"
    echo "  ./docker-helper.sh stack-up"
    echo "  ./docker-helper.sh logs"
}

cmd_build_dev() {
    print_header "Building Development Image"
    docker build -f Dockerfile.dev -t "$DEV_IMAGE" .
    print_success "Development image built successfully!"
}

cmd_build_prod() {
    print_header "Building Production Image"
    docker build -f Dockerfile.prod -t "$PROD_IMAGE" .
    print_success "Production image built successfully!"
}

cmd_run_dev() {
    print_header "Running Development Container"
    docker run -d \
        --name "$PROJECT_NAME-dev" \
        -p 8080:8080 \
        -e SPRING_PROFILES_ACTIVE=dev \
        "$DEV_IMAGE"
    print_success "Development container started!"
    echo ""
    echo "Access: http://localhost:8080"
    echo "Health: http://localhost:8080/actuator/health"
    echo ""
    echo "View logs: ./docker-helper.sh logs"
}

cmd_run_prod() {
    print_header "Running Production Container"
    
    # Verificar se variáveis necessárias estão definidas
    if [ -z "$SPRING_DATASOURCE_URL" ]; then
        print_error "SPRING_DATASOURCE_URL não definida!"
        echo "Use: export SPRING_DATASOURCE_URL=jdbc:postgresql://..."
        exit 1
    fi
    
    docker run -d \
        --name "$PROJECT_NAME-prod" \
        -p 8080:8080 \
        -e SPRING_PROFILES_ACTIVE=prod \
        -e SPRING_DATASOURCE_URL="$SPRING_DATASOURCE_URL" \
        -e SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-postgres}" \
        -e SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD}" \
        -e JWT_SECRET="${JWT_SECRET}" \
        -e ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-*}" \
        "$PROD_IMAGE"
    print_success "Production container started!"
}

cmd_stack_up() {
    print_header "Starting Full Stack"
    docker-compose up -d
    print_success "Stack started successfully!"
    echo ""
    echo "Services:"
    echo "  Backend:  http://localhost:8080"
    echo "  PgAdmin:  http://localhost:5050"
    echo "  Postgres: localhost:5432"
    echo ""
    echo "View logs: ./docker-helper.sh stack-logs"
}

cmd_stack_down() {
    print_header "Stopping Full Stack"
    docker-compose down
    print_success "Stack stopped successfully!"
}

cmd_stack_logs() {
    print_header "Stack Logs"
    docker-compose logs -f
}

cmd_stack_restart() {
    print_header "Restarting Full Stack"
    docker-compose restart
    print_success "Stack restarted successfully!"
}

cmd_logs() {
    print_header "Container Logs"
    CONTAINER=$(docker ps -q -f name="$PROJECT_NAME")
    if [ -z "$CONTAINER" ]; then
        print_error "No running container found!"
        exit 1
    fi
    docker logs -f "$CONTAINER"
}

cmd_shell() {
    print_header "Opening Shell"
    CONTAINER=$(docker ps -q -f name="$PROJECT_NAME")
    if [ -z "$CONTAINER" ]; then
        print_error "No running container found!"
        exit 1
    fi
    docker exec -it "$CONTAINER" /bin/sh
}

cmd_test() {
    print_header "Testing Docker Image"
    
    # Test DEV image
    echo "Testing DEV image..."
    docker run -d --name test-dev -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev "$DEV_IMAGE"
    sleep 30
    
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_success "DEV image is healthy!"
    else
        print_error "DEV image health check failed!"
    fi
    
    docker stop test-dev && docker rm test-dev
}

cmd_clean() {
    print_header "Cleaning Docker Resources"
    
    # Stop all containers
    echo "Stopping containers..."
    docker ps -q -f name="$PROJECT_NAME" | xargs -r docker stop
    
    # Remove containers
    echo "Removing containers..."
    docker ps -a -q -f name="$PROJECT_NAME" | xargs -r docker rm
    
    # Remove images
    echo "Removing images..."
    docker images -q "$PROJECT_NAME" | xargs -r docker rmi
    
    print_success "Cleanup completed!"
}

cmd_status() {
    print_header "Container Status"
    docker ps -a --filter name="$PROJECT_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main
main() {
    case "${1:-help}" in
        build-dev)
            cmd_build_dev
            ;;
        build-prod)
            cmd_build_prod
            ;;
        run-dev)
            cmd_run_dev
            ;;
        run-prod)
            cmd_run_prod
            ;;
        stack-up)
            cmd_stack_up
            ;;
        stack-down)
            cmd_stack_down
            ;;
        stack-logs)
            cmd_stack_logs
            ;;
        stack-restart)
            cmd_stack_restart
            ;;
        logs)
            cmd_logs
            ;;
        shell)
            cmd_shell
            ;;
        test)
            cmd_test
            ;;
        clean)
            cmd_clean
            ;;
        status)
            cmd_status
            ;;
        help|*)
            cmd_help
            ;;
    esac
}

main "$@"
