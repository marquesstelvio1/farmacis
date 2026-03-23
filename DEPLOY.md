# 🚀 Deploy da Farmácia Digital

Este guia explica como fazer o deploy da aplicação Farmácia Digital no Vercel (Frontend) e Render (Backend).

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Render](https://render.com)
- Banco de dados PostgreSQL no [Supabase](https://supabase.com)
- Chaves de API necessárias (OpenAI, Stripe, etc.)

## 🗄️ Configuração do Banco de Dados (Supabase)

1. Crie um projeto no Supabase
2. Execute as migrações do banco:
   ```bash
   npm run db:push
   ```
3. Copie a **Connection String** do Supabase (Settings > Database)

## 🔧 Deploy do Backend (Render)

### Opção 1: Deploy via Git (Recomendado)

1. **Conecte seu repositório Git ao Render**
2. **Configure o serviço web:**
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. **Configure as variáveis de ambiente:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://[your-supabase-connection-string]
   OPENAI_API_KEY=your_openai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM="Farmácia Digital <noreply@farmacia.com>"
   SESSION_SECRET=your-secure-random-secret
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=uploads
   ```

### Opção 2: Deploy via Docker

1. Use o arquivo `Dockerfile.render` incluído
2. Configure as mesmas variáveis de ambiente acima

## 🎨 Deploy do Frontend (Vercel)

### Deploy Automático via Git

1. **Conecte seu repositório Git ao Vercel**
2. **Configure o projeto:**
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Configure as variáveis de ambiente:**
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   VITE_APP_NAME=Farmácia Digital
   VITE_APP_URL=https://your-vercel-app.vercel.app
   ```

### Deploy Manual

1. **Instale a Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy do cliente:**
   ```bash
   cd client
   vercel --prod
   ```

## 🔗 Conexão Frontend ↔ Backend

Após o deploy:

1. **Copie a URL do Render** (ex: `https://farmacia-backend.onrender.com`)
2. **Atualize a variável `VITE_API_URL`** no Vercel com essa URL
3. **Re-deploy o frontend** no Vercel

## ✅ Verificação do Deploy

### Backend (Render)
- ✅ Logs mostram "serving on port 10000"
- ✅ Endpoint `/api/health` responde 200
- ✅ Conexão com banco de dados funciona

### Frontend (Vercel)
- ✅ Aplicação carrega sem erros
- ✅ API calls funcionam (verificar Network tab)
- ✅ Variáveis de ambiente estão corretas

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de CORS:**
- Verifique se `APP_URL` no backend aponta para o frontend Vercel

**Erro de Banco:**
- Confirme que a `DATABASE_URL` do Supabase está correta
- Verifique se as migrações foram executadas

**API não responde:**
- Verifique se o backend está rodando na porta 10000
- Confirme que as variáveis de ambiente estão setadas

### Logs e Debug

**Render Logs:**
- Acesse o dashboard do Render > Service > Logs

**Vercel Logs:**
- Acesse o dashboard do Vercel > Project > Functions/Edge Functions

## 🔒 Segurança

- ✅ Nunca commite chaves de API no código
- ✅ Use variáveis de ambiente para todas as chaves sensíveis
- ✅ Configure CORS adequadamente
- ✅ Use HTTPS em produção

## 📞 Suporte

Para dúvidas sobre deploy, consulte:
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Render](https://docs.render.com)
- [Documentação Supabase](https://supabase.com/docs)