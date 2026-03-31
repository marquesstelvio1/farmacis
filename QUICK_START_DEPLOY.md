# 🚀 Quick Start - Deploy Rápido

Para deploy rápido em produção, siga estes passos:

## Windows (PowerShell)

```powershell
# 1. Executar script de deploy
.\deploy.ps1

# 2. Iniciar aplicação
npm start

# OU usar PM2 (recomendado para produção)
pm2 start dist/index.cjs --name farmacis
pm2 save
pm2 startup
```

## Linux/Mac

```bash
# 1. Dar permissão ao script
chmod +x deploy.sh

# 2. Executar deploy
./deploy.sh

# 3. Iniciar aplicação
npm start

# OU usar PM2 (recomendado para produção)
pm2 start dist/index.cjs --name farmacis
pm2 save
pm2 startup
```

## Verificação Rápida

```bash
# Backend está rodando?
netstat -ano | findstr :5001

# Health check
curl http://localhost:5001/api/health

# Logs (PM2)
pm2 logs farmacis --lines 50
```

## Testes Essenciais

1. **Botão de emergência** - Aparece no client?
2. **Pagamento** - Upload de comprovativo marca como "Pago"?
3. **Admins** - Lista apenas administradores reais?
4. **Dark mode** - Funciona o toggle?

## Problemas Comuns

### Porta 5001 ocupada
```powershell
# Windows
netstat -ano | findstr :5001
Stop-Process -Id <PID> -Force

# Linux
lsof -ti:5001 | xargs kill -9
```

### Build falha
```bash
npm run clean:vite
npm install
npm run build
```

### Migração falha
```bash
npx tsx migrate_payment_status.ts
```

## Documentação Completa

- ✅ **Checklist:** DEPLOY_CHECKLIST.md
- 📖 **Guia Completo:** DEPLOY_UPDATE.md
- 📋 **Resumo:** RESUMO_ATUALIZACOES.md
- 🗺️ **Deploy Original:** DEPLOY.md

---

**Tempo estimado:** 15-30 minutos  
**Dificuldade:** Baixa  
**Risco:** Baixo

Boa sorte! 🎉
