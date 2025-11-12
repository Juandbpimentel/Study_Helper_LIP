#!/bin/bash
# ========================================
# Load Environment Variables - Bash
# Study Helper Backend
# Created: 2025-11-11
# Author: Juandbpimentel
# ========================================
# Este script carrega variáveis de ambiente de um arquivo .env
#
# USO:
# source load-env.sh
# source load-env.sh .env.dev
# source load-env.sh .env.prod
# ========================================

ENV_FILE="${1:-.env}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Verifica se o arquivo existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Erro: Arquivo '$ENV_FILE' não encontrado!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Arquivos .env disponíveis:${NC}"
    ls -1 *.env* 2>/dev/null || echo "  Nenhum arquivo .env encontrado"
    echo ""
    echo -e "${CYAN}💡 Dica: Copie um arquivo .example primeiro:${NC}"
    echo -e "${GRAY}   cp .env.example .env${NC}"
    return 1 2>/dev/null || exit 1
fi

echo -e "${GREEN}🔧 Carregando variáveis de ambiente de: $ENV_FILE${NC}"
echo ""

VAR_COUNT=0

# Lê cada linha do arquivo
while IFS= read -r line || [ -n "$line" ]; do
    # Remove espaços em branco
    line=$(echo "$line" | xargs)
    
    # Ignora linhas vazias e comentários
    if [ -z "$line" ] || [[ "$line" =~ ^# ]]; then
        continue
    fi
    
    # Processa linhas com formato KEY=VALUE
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove aspas se existirem
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Exporta a variável
        export "$key=$value"
        
        VAR_COUNT=$((VAR_COUNT + 1))
        echo -e "${GRAY}  ✓ $key${NC}"
    fi
done < "$ENV_FILE"

echo ""
echo -e "${GREEN}✅ $VAR_COUNT variáveis carregadas com sucesso!${NC}"
echo ""
echo -e "${CYAN}🚀 Agora você pode executar a aplicação:${NC}"
echo -e "${GRAY}   ./gradlew bootRun${NC}"
echo ""
echo -e "${CYAN}📋 Para verificar as variáveis:${NC}"
echo -e "${GRAY}   printenv | grep SPRING${NC}"
echo ""
