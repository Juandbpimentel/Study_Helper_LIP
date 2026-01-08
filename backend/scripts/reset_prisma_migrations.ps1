# reset_prisma_migrations.ps1
# - Confirma com o usuário
# - Chama o script Node para resetar o schema (DROP/CREATE)
# - Remove todas as pastas em prisma/migrations
# Usage: .\reset_prisma_migrations.ps1  (executar no diretório backend)
# Optional: -Yes to pular prompt interactive
param(
  [switch]$Yes
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Este script irá (1) resetar o schema 'public' do banco apontado por backend/.env e (2) remover todas as pastas em prisma/migrations." -ForegroundColor Yellow
if (-not $Yes) {
  $confirm = Read-Host "Digite YES para confirmar"
  if ($confirm -ne 'YES') {
    Write-Host "Aborted by user" -ForegroundColor Cyan
    exit 0
  }
}

# Verifica existência do node
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Error "Node não encontrado no PATH. Instale Node.js e tente novamente."
  exit 1
}

# Executa o script Node que faz DROP/CREATE do schema
Write-Host "Executando reset do schema com Node..." -ForegroundColor Green
& node ./scripts/reset_prisma_db.js --yes
if ($LASTEXITCODE -ne 0) {
  Write-Error "Falha ao resetar o schema. Abortando."; exit $LASTEXITCODE
}

# Remove pastas de migrations
$migrationsDir = Join-Path $root 'prisma\migrations'
if (-not (Test-Path $migrationsDir)) {
  Write-Host "Diretório prisma/migrations não existe. Nada a remover." -ForegroundColor Cyan
  exit 0
}

$folders = Get-ChildItem -Path $migrationsDir -Directory
if ($folders.Count -eq 0) {
  Write-Host "Nenhuma migration local encontrada em prisma/migrations." -ForegroundColor Cyan
  exit 0
}

Write-Host "Encontradas $($folders.Count) pastas de migration. Removendo..." -ForegroundColor Green
foreach ($f in $folders) {
  Write-Host "Removendo: $($f.FullName)"
  Remove-Item -LiteralPath $f.FullName -Recurse -Force
}

Write-Host "Remoção de migrations concluída." -ForegroundColor Green
Write-Host "Próximos passos sugeridos:" -ForegroundColor Yellow
Write-Host "  1) Gerar nova migration baseline: cd backend; npx prisma migrate dev --name init" -ForegroundColor Cyan
Write-Host "  2) Gerar client: npx prisma generate" -ForegroundColor Cyan
Write-Host "  3) Se necessário, restaurar dados de backup antes de prosseguir." -ForegroundColor Cyan

exit 0
