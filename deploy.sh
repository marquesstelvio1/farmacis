#!/bin/bash

# Script de deploy para Farmácis
# Execute este script no servidor de produção

set -e

echo "🚀 Iniciando deploy do Farmácis..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Erro: Arquivo .env não encontrado. Copie .env.example para .env e configure as variáveis"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Executar migrações do banco
echo "🗄️ Executando migrações do banco..."
npm run db:push

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou"
    exit 1
fi

# Criar diretório de uploads se não existir
mkdir -p uploads

# Configurar permissões
chmod -R 755 uploads
chmod 644 .env

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "Para iniciar a aplicação:"
echo "  npm start"
echo ""
echo "Ou usando PM2:"
echo "  pm2 start dist/index.cjs --name farmacis"
echo "  pm2 save"
echo "  pm2 startup"