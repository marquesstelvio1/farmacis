# Script de Deploy para Farmácis - Windows PowerShell
# Execute este script no servidor de produção

Write-Host "🚀 Iniciando deploy do Farmácis..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Erro: Arquivo .env não encontrado. Copie .env.example para .env e configure as variáveis" -ForegroundColor Red
    exit 1
}

try {
    # Instalar dependências
    Write-Host "`n📦 Instalando dependências..." -ForegroundColor Cyan
    npm install --omit=dev --no-optional
    if ($LASTEXITCODE -ne 0) { throw "npm install falhou" }

    # Executar migrações do banco
    Write-Host "`n🗄️ Executando migrações do banco..." -ForegroundColor Cyan
    npm run db:push
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "⚠️  Aviso: db:push falhou, continuando..." -ForegroundColor Yellow
    }

    # Rodar migração de pagamento (nova funcionalidade)
    Write-Host "`n💳 Rodando migração de status de pagamento..." -ForegroundColor Cyan
    npx tsx migrate_payment_status.ts
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "⚠️  Aviso: migrate_payment_status falhou, continuando..." -ForegroundColor Yellow
    }

    # Build da aplicação
    Write-Host "`n🔨 Fazendo build da aplicação..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build falhou" }

    # Verificar se o build foi bem-sucedido
    if (-not (Test-Path "dist")) {
        Write-Host "❌ Erro: Build falhou - pasta dist não encontrada" -ForegroundColor Red
        exit 1
    }

    # Criar diretório de uploads se não existir
    if (-not (Test-Path "uploads")) {
        New-Item -ItemType Directory -Path "uploads" | Out-Null
        Write-Host "✓ Pasta uploads criada" -ForegroundColor Green
    }

    Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar a aplicação:" -ForegroundColor Cyan
    Write-Host "  npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou usando PM2:" -ForegroundColor Cyan
    Write-Host "  pm2 start dist/index.cjs --name farmacis" -ForegroundColor White
    Write-Host "  pm2 save" -ForegroundColor White
    Write-Host "  pm2 startup" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Erro durante o deploy: $_" -ForegroundColor Red
    exit 1
}
