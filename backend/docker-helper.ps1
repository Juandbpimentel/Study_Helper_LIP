# ========================================
# Docker Helper Script (PowerShell)
# Study Helper Backend - Development
# ========================================
# Facilita operações comuns com Docker no Windows
# Uso: .\docker-helper.ps1 [comando]
# ========================================

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Variáveis
$ProjectName = "studyhelper-backend"
$DevImage = "${ProjectName}:dev"
$ProdImage = "${ProjectName}:prod"

# Funções de Output
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Comandos
function Show-Help {
    Write-Header "Docker Helper - Study Helper Backend"
    Write-Host ""
    Write-Host "Comandos disponíveis:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  build-dev          " -ForegroundColor Green -NoNewline
    Write-Host "- Build imagem de desenvolvimento"
    Write-Host "  build-prod         " -ForegroundColor Green -NoNewline
    Write-Host "- Build imagem de produção"
    Write-Host "  run-dev            " -ForegroundColor Green -NoNewline
    Write-Host "- Rodar container de desenvolvimento"
    Write-Host "  run-prod           " -ForegroundColor Green -NoNewline
    Write-Host "- Rodar container de produção"
    Write-Host "  stack-up           " -ForegroundColor Green -NoNewline
    Write-Host "- Iniciar stack completo (backend + postgres + pgadmin)"
    Write-Host "  stack-down         " -ForegroundColor Green -NoNewline
    Write-Host "- Parar stack completo"
    Write-Host "  stack-logs         " -ForegroundColor Green -NoNewline
    Write-Host "- Ver logs do stack"
    Write-Host "  stack-restart      " -ForegroundColor Green -NoNewline
    Write-Host "- Reiniciar stack completo"
    Write-Host "  logs               " -ForegroundColor Green -NoNewline
    Write-Host "- Ver logs do backend"
    Write-Host "  shell              " -ForegroundColor Green -NoNewline
    Write-Host "- Abrir shell no container"
    Write-Host "  test               " -ForegroundColor Green -NoNewline
    Write-Host "- Testar imagem Docker"
    Write-Host "  clean              " -ForegroundColor Green -NoNewline
    Write-Host "- Limpar containers e imagens"
    Write-Host "  status             " -ForegroundColor Green -NoNewline
    Write-Host "- Ver status dos containers"
    Write-Host "  help               " -ForegroundColor Green -NoNewline
    Write-Host "- Mostrar esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Cyan
    Write-Host "  .\docker-helper.ps1 build-dev"
    Write-Host "  .\docker-helper.ps1 stack-up"
    Write-Host "  .\docker-helper.ps1 logs"
}

function Build-Dev {
    Write-Header "Building Development Image"
    docker build -f Dockerfile.dev -t $DevImage .
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Development image built successfully!"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

function Build-Prod {
    Write-Header "Building Production Image"
    docker build -f Dockerfile.prod -t $ProdImage .
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Production image built successfully!"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

function Run-Dev {
    Write-Header "Running Development Container"
    docker run -d `
        --name "${ProjectName}-dev" `
        -p 8080:8080 `
        -e SPRING_PROFILES_ACTIVE=dev `
        $DevImage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Development container started!"
        Write-Host ""
        Write-Host "Access: http://localhost:8080" -ForegroundColor Cyan
        Write-Host "Health: http://localhost:8080/actuator/health" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View logs: .\docker-helper.ps1 logs"
    } else {
        Write-Error "Failed to start container!"
    }
}

function Run-Prod {
    Write-Header "Running Production Container"
    
    # Verificar variáveis de ambiente
    if (-not $env:SPRING_DATASOURCE_URL) {
        Write-Error "SPRING_DATASOURCE_URL não definida!"
        Write-Host "Use: `$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://...'"
        exit 1
    }
    
    docker run -d `
        --name "${ProjectName}-prod" `
        -p 8080:8080 `
        -e SPRING_PROFILES_ACTIVE=prod `
        -e SPRING_DATASOURCE_URL="$env:SPRING_DATASOURCE_URL" `
        -e SPRING_DATASOURCE_USERNAME="$($env:SPRING_DATASOURCE_USERNAME ?? 'postgres')" `
        -e SPRING_DATASOURCE_PASSWORD="$env:SPRING_DATASOURCE_PASSWORD" `
        -e JWT_SECRET="$env:JWT_SECRET" `
        -e ALLOWED_ORIGINS="$($env:ALLOWED_ORIGINS ?? '*')" `
        $ProdImage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Production container started!"
    }
}

function Stack-Up {
    Write-Header "Starting Full Stack"
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Stack started successfully!"
        Write-Host ""
        Write-Host "Services:" -ForegroundColor Cyan
        Write-Host "  Backend:  http://localhost:8080"
        Write-Host "  PgAdmin:  http://localhost:5050"
        Write-Host "  Postgres: localhost:5432"
        Write-Host ""
        Write-Host "View logs: .\docker-helper.ps1 stack-logs"
    }
}

function Stack-Down {
    Write-Header "Stopping Full Stack"
    docker-compose down
    Write-Success "Stack stopped successfully!"
}

function Stack-Logs {
    Write-Header "Stack Logs"
    docker-compose logs -f
}

function Stack-Restart {
    Write-Header "Restarting Full Stack"
    docker-compose restart
    Write-Success "Stack restarted successfully!"
}

function Show-Logs {
    Write-Header "Container Logs"
    $Container = docker ps -q -f "name=$ProjectName"
    if (-not $Container) {
        Write-Error "No running container found!"
        exit 1
    }
    docker logs -f $Container
}

function Open-Shell {
    Write-Header "Opening Shell"
    $Container = docker ps -q -f "name=$ProjectName"
    if (-not $Container) {
        Write-Error "No running container found!"
        exit 1
    }
    docker exec -it $Container /bin/sh
}

function Test-Image {
    Write-Header "Testing Docker Image"
    
    Write-Host "Testing DEV image..." -ForegroundColor Cyan
    docker run -d --name test-dev -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev $DevImage
    Start-Sleep -Seconds 30
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -ErrorAction Stop
        Write-Success "DEV image is healthy!"
    } catch {
        Write-Error "DEV image health check failed!"
    }
    
    docker stop test-dev | Out-Null
    docker rm test-dev | Out-Null
}

function Clean-Docker {
    Write-Header "Cleaning Docker Resources"
    
    Write-Host "Stopping containers..." -ForegroundColor Yellow
    docker ps -q -f "name=$ProjectName" | ForEach-Object { docker stop $_ }
    
    Write-Host "Removing containers..." -ForegroundColor Yellow
    docker ps -a -q -f "name=$ProjectName" | ForEach-Object { docker rm $_ }
    
    Write-Host "Removing images..." -ForegroundColor Yellow
    docker images -q "$ProjectName" | ForEach-Object { docker rmi $_ }
    
    Write-Success "Cleanup completed!"
}

function Show-Status {
    Write-Header "Container Status"
    docker ps -a --filter "name=$ProjectName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main
switch ($Command.ToLower()) {
    "build-dev" { Build-Dev }
    "build-prod" { Build-Prod }
    "run-dev" { Run-Dev }
    "run-prod" { Run-Prod }
    "stack-up" { Stack-Up }
    "stack-down" { Stack-Down }
    "stack-logs" { Stack-Logs }
    "stack-restart" { Stack-Restart }
    "logs" { Show-Logs }
    "shell" { Open-Shell }
    "test" { Test-Image }
    "clean" { Clean-Docker }
    "status" { Show-Status }
    default { Show-Help }
}
