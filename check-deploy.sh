#!/bin/bash

# 🚀 Farmácia Digital - Deploy Script
# This script helps verify your deployment configuration

set -e

echo "🚀 Verificando configuração de deploy da Farmácia Digital"
echo "======================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Copie o .env.example para .env e configure as variáveis"
    echo "   cp .env.example .env"
    exit 1
fi

# Check required environment variables
echo "🔍 Verificando variáveis de ambiente obrigatórias..."

required_vars=("DATABASE_URL" "OPENAI_API_KEY" "STRIPE_SECRET_KEY" "SESSION_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Variáveis de ambiente obrigatórias não encontradas:"
    printf '   - %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"

# Check if build works
echo "🔨 Testando build do projeto..."
if npm run build; then
    echo "✅ Build realizado com sucesso"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi

# Check if database connection works
echo "🗄️  Testando conexão com banco de dados..."
if npm run check; then
    echo "✅ TypeScript check passou"
else
    echo "❌ Erro no TypeScript check"
    exit 1
fi

echo ""
echo "🎉 Configuração de deploy verificada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure seu repositório Git:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy no Render:"
echo "   - Conecte seu repositório Git"
echo "   - Use as configurações do render.yaml"
echo "   - Configure as variáveis de ambiente"
echo ""
echo "3. Deploy no Vercel:"
echo "   - Conecte seu repositório Git"
echo "   - Root Directory: client"
echo "   - Configure VITE_API_URL com a URL do Render"
echo ""
echo "4. Atualize FRONTEND_URL no Render com a URL do Vercel"
echo ""
echo "📖 Para instruções detalhadas, consulte DEPLOY.md"