# ✅ Checklist de Deploy - Farmácis

Use esta checklist para garantir que todos os passos foram completados corretamente.

## 📋 Pré-Deploy

- [ ] Backup do banco de dados realizado
- [ ] Código atualizado no servidor (git pull ou upload)
- [ ] Arquivo `.env` configurado com todas as variáveis
- [ ] Permissões de execução para scripts (`chmod +x deploy.sh`)

## 🔧 Execução do Deploy

### Opção A: Script Automático

- [ ] Executar `./deploy.sh` (Linux/Mac)
- [ ] OU `.\deploy.ps1` (Windows PowerShell)
- [ ] Verificar se script completou sem erros

### Opção B: Manual

- [ ] `npm install --omit=dev --no-optional`
- [ ] `npm run db:push`
- [ ] `npx tsx migrate_payment_status.ts` ⚠️ **Importante!**
- [ ] `npm run build`
- [ ] Verificar pasta `dist/` criada

## 🚀 Inicialização

- [ ] Criar pasta `uploads/` se não existir
- [ ] Configurar permissões da pasta uploads (755)
- [ ] Iniciar aplicação: `npm start`
- [ ] OU usar PM2: `pm2 start dist/index.cjs --name farmacis`
- [ ] Salvar PM2: `pm2 save`
- [ ] Configurar PM2 startup: `pm2 startup`

## ✅ Verificações Pós-Deploy

### Backend (Porta 5001)

- [ ] Backend está rodando na porta 5001
  ```bash
  netstat -ano | findstr :5001
  ```
  
- [ ] Health check responde
  ```bash
  curl http://localhost:5001/api/health
  ```

- [ ] Logs mostram "serving on port 5001"
  ```bash
  pm2 logs farmacis --lines 50
  ```

### Frontend Client

- [ ] Aplicação carrega sem erros no navegador
- [ ] Botão de emergência aparece (canto inferior direito)
- [ ] Rota `/emergencia` funciona
- [ ] Upload de comprovativo marca como "Pago" (não "Pendente")

### Admin Dashboard

- [ ] Página de Usuários mostra apenas usuários comuns
- [ ] Página de Administradores mostra apenas admins reais
- [ ] Exclusão de admin mostra mensagens adequadas
- [ ] Dark mode funciona em todas as páginas

## 🧪 Testes Funcionais

### 1. Botão de Emergência
- [ ] Botão flutuante visível
- [ ] Modal abre ao clicar
- [ ] Pode adicionar contactos em `/emergencia`
- [ ] Contactos são salvos no localStorage

### 2. Pagamento com Comprovativo
- [ ] Fazer pedido com pagamento eletrónico
- [ ] Upload de comprovativo funciona
- [ ] Status muda para "Pago" imediatamente (não "Pendente")
- [ ] Pharmacy admin vê status correto

### 3. Admin Users
- [ ] Lista apenas administradores da tabela `admin_users`
- [ ] Criar novo admin funciona
- [ ] Editar admin funciona
- [ ] Excluir admin mostra feedback adequado

### 4. Dark Mode
- [ ] Toggle de tema funciona
- [ ] Preferência persiste após refresh
- [ ] Todas as páginas respeitam o tema
- [ ] Cores consistentes em light/dark mode

## 🐛 Troubleshooting Comum

### Erro: Porta 5001 já em uso
```bash
# Windows PowerShell
netstat -ano | findstr :5001
Stop-Process -Id <PID> -Force

# Linux/Mac
lsof -ti:5001 | xargs kill -9
```

### Erro: Build falha
```bash
# Limpar cache
npm run clean:vite

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Build novamente
npm run build
```

### Erro: migrate_payment_status falha
```bash
# Verificar conexão com banco
npx tsx check_db.ts

# Tentar novamente
npx tsx migrate_payment_status.ts
```

### Erro: CORS no frontend
- [ ] Verificar `APP_URL` no backend aponta para URL correta
- [ ] Verificar `VITE_API_URL` no frontend está correto

## 📊 Monitoramento Contínuo

### Diariamente
- [ ] Verificar logs de erro: `pm2 logs farmacis`
- [ ] Checar saúde do sistema: `curl http://localhost:5001/api/health`

### Semanalmente
- [ ] Revisar métricas de desempenho
- [ ] Verificar espaço em disco
- [ ] Checar backups do banco

### Mensalmente
- [ ] Atualizar dependências de segurança
- [ ] Revisar logs de acesso
- [ ] Testar disaster recovery

## 🔒 Segurança

- [ ] `.env` não está versionado no Git
- [ ] Senhas do banco são fortes
- [ ] HTTPS habilitado em produção
- [ ] Firewall configurado corretamente
- [ ] Backups automáticos funcionando

## 📝 Notas do Deploy

**Data do Deploy:** ___/___/_____

**Versão/Commit:** ___________________

**Responsável:** ___________________

**Problemas encontrados:**
```
_________________________________
_________________________________
```

**Ações tomadas:**
```
_________________________________
_________________________________
```

## ✨ Pronto para Produção?

Quando TODOS os itens acima estiverem marcados como concluídos, seu deploy está pronto!

---

**Próximo passo:** Monitorar por 24 horas e coletar feedback dos usuários.

**Dúvidas?** Consulte DEPLOY.md ou DEPLOY_UPDATE.md
