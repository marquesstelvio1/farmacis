# 🚀 Atualização de Deploy - Farmácis

Este guia explica como atualizar o deploy da aplicação com as últimas melhorias.

## ✅ Melhorias Incluídos nesta Atualização

### 1. **Botão de Emergência** (Client)
- Botão flutuante para emergências médicas
- Gerenciamento de contactos de emergência
- Integração com serviços de emergência (futuro)

### 2. **Correção do Status de Pagamento**
- Orders com comprovativo agora marcam `paymentStatus` como "paid"
- Fim do problema "Pagamento Pendente" após envio do comprovativo

### 3. **Dark Mode Completo**
- Todas as páginas admin com dark mode
- Persistência do tema por usuário
- Tema consistente em todas as aplicações

### 4. **Melhorias na Administração**
- Correção na listagem de administradores
- Melhor tratamento de erros ao excluir admins
- Logs detalhados para debugging

## 📋 Pré-requisitos

- Acesso ao terminal/SSH no servidor de produção
- Variáveis de ambiente configuradas (.env)
- Banco de dados acessível

## 🔧 Opções de Deploy

### Opção 1: Deploy Automático (Recomendado)

Execute o script de deploy atualizado:

```bash
# No servidor de produção
./deploy.sh
```

Ou no Windows (PowerShell):

```powershell
npm run build
npm start
```

### Opção 2: Deploy Manual Passo a Passo

#### 1. **Atualizar o Código**

```bash
# Se estiver usando Git
git pull origin main

# Ou faça upload dos arquivos atualizados
```

#### 2. **Instalar Dependências**

```bash
npm install --omit=dev --no-optional
```

#### 3. **Executar Migrações**

```bash
npm run db:push
```

#### 4. **Rodar Migração de Pagamento** (Importante!)

Esta migração corrige pedidos antigos que têm comprovativo mas estão como "pendente":

```bash
npx tsx migrate_payment_status.ts
```

#### 5. **Build da Aplicação**

```bash
npm run build
```

#### 6. **Iniciar a Aplicação**

```bash
# Direto
npm start

# Ou com PM2 (produção)
pm2 restart farmacis
# ou
pm2 start dist/index.cjs --name farmacis
pm2 save
```

## 🎯 Verificação Pós-Deploy

### Backend (Porta 5001)

1. **Verificar se está rodando:**
   ```bash
   netstat -ano | findstr :5001
   # ou
   lsof -i :5001
   ```

2. **Testar health check:**
   ```bash
   curl http://localhost:5001/api/health
   ```

3. **Verificar logs:**
   - Se usar PM2: `pm2 logs farmacis`
   - Se usar Docker: `docker logs <container>`

### Frontend Client

1. **Acessar:** http://localhost:5175 (dev) ou sua URL de produção
2. **Testar botão de emergência:** Deve aparecer no canto inferior direito
3. **Verificar página de emergência:** /emergencia
4. **Testar upload de comprovativo:** Deve marcar como "Pago" imediatamente

### Admin Dashboard

1. **Acessar:** http://localhost:3000/admin-users
2. **Verificar admins:** Apenas administradores reais devem aparecer
3. **Testar exclusão:** Deve mostrar mensagens de erro adequadas

## 🐛 Troubleshooting

### Problema: Backend não inicia

**Solução:**
```bash
# Verificar porta em uso
netstat -ano | findstr :5001

# Matar processo se necessário (Linux/Mac)
kill -9 <PID>

# Windows PowerShell
Stop-Process -Id <PID> -Force

# Reiniciar
npm start
```

### Problema: Erro "paymentStatus not updated"

**Solução:**
```bash
# Rodar migração de correção
npx tsx migrate_payment_status.ts

# Verificar se há ordens com problema
npx tsx check-users-vs-admins.ts
```

### Problema: Build falha

**Solução:**
```bash
# Limpar cache
rm -rf node_modules/.vite dist
npm run clean:vite

# Reinstalar
npm install

# Build novamente
npm run build
```

## 📊 Monitoramento

### Logs em Produção

**PM2:**
```bash
pm2 logs farmacis --lines 100
```

**Docker:**
```bash
docker logs farmacis-backend --tail 100
```

**Render:**
- Dashboard > Service > Logs

### Health Checks

```bash
# Backend
curl http://your-server.com:5001/api/health

# Client
curl http://your-frontend.com/
```

## 🔒 Segurança

- ✅ Nunca commite `.env` no Git
- ✅ Use senhas fortes no banco de dados
- ✅ Mantenha dependências atualizadas
- ✅ Monitore logs regularmente

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs de erro
2. Execute `npx tsx check-db.ts` para verificar o banco
3. Consulte DEPLOY.md para detalhes de configuração

---

**Próxima atualização:** Implementar chamada real para ambulância e envio de SMS para contactos de emergência.
