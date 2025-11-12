# ========================================
# Load Environment Variables - PowerShell
# Study Helper Backend
# Created: 2025-11-11
# Author: Juandbpimentel
# ========================================
# Este script carrega variáveis de ambiente de um arquivo .env
#
# USO:
# .\load-env.ps1
# .\load-env.ps1 -EnvFile .env.dev
# .\load-env.ps1 -EnvFile .env.prod
# ========================================

param(
    [string]$EnvFile = ".env"
)

# Verifica se o arquivo existe
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ Erro: Arquivo '$EnvFile' não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Arquivos .env disponíveis:" -ForegroundColor Yellow
    Get-ChildItem -Filter "*.env*" | Select-Object Name
    Write-Host ""
    Write-Host "💡 Dica: Copie um arquivo .example primeiro:" -ForegroundColor Cyan
    Write-Host "   cp .env.example .env" -ForegroundColor Gray
    exit 1
}

Write-Host "🔧 Carregando variáveis de ambiente de: $EnvFile" -ForegroundColor Green
Write-Host ""

$lineCount = 0
$varCount = 0

# Lê cada linha do arquivo
Get-Content $EnvFile | ForEach-Object {
    $lineCount++
    $line = $_.Trim()
    
    # Ignora linhas vazias e comentários
    if ($line -eq "" -or $line.StartsWith("#")) {
        return
    }
    
    # Processa linhas com formato KEY=VALUE
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove aspas se existirem
        $value = $value -replace '^["'']|["'']$', ''
        
        # Define a variável de ambiente
        [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
        
        $varCount++
        Write-Host "  ✓ $key" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ $varCount variáveis carregadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Agora você pode executar a aplicação:" -ForegroundColor Cyan
Write-Host "   .\gradlew bootRun" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Para verificar as variáveis:" -ForegroundColor Cyan
Write-Host "   Get-ChildItem Env:" -ForegroundColor Gray
Write-Host ""
