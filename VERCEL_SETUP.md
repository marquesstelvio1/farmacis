# 📋 Configuração do Vercel - Passo a Passo

## 1️⃣ Conectar Repositório Git

1. Aceda a [vercel.com](https://vercel.com)
2. Clique em **"Add New..."** → **"Project"**
3. Selecione seu repositório GitHub
4. Autorize o Vercel a aceder ao repositório

## 2️⃣ Configurar o Projeto

Na página de configuração do projeto:

### Root Directory
```
client
```

### Build and Output Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### ⚠️ Importante: Dependências

Certifique-se de que todas as dependências usadas no frontend (incluindo plugins do Tailwind como `tailwindcss-animate`) estão listadas no `package.json` dentro da pasta `client`.

Se o build falhar com "Cannot find module", instale a dependência na pasta cliente:
```bash
cd client && npm install tailwindcss-animate
```

## 3️⃣ Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no Vercel:

### Produção (Environment: Production)
```
VITE_API_URL=https://seu-backend-render.onrender.com
VITE_APP_NAME=Farmácia Digital
VITE_APP_URL=https://seu-app.vercel.app
```

### Pré-visualização (Environment: Preview)
```
VITE_API_URL=https://seu-backend-render-preview.onrender.com
VITE_APP_NAME=Farmácia Digital (Preview)
VITE_APP_URL=https://seu-app-preview.vercel.app
```

### Desenvolvimento (Environment: Development)
```
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=Farmácia Digital (Dev)
VITE_APP_URL=http://localhost:5180
```

## 4️⃣ Domínio Personalizado (Opcional)

1. Vá para **"Settings"** → **"Domains"**
2. Clique em **"Add"**
3. Adicione seu domínio (ex: farmacia.com)
4. Configure os registos DNS

## 5️⃣ Ativar Headers e Redirects (Se necessário)

Crie `client/vercel.json` (já existe) com:
- Regras de reescrita para SPA
- Headers de CORS (se necessário)
- Configurações de cache

## 6️⃣ Deploy

O deploy é **automático** quando você faz push para `main`:
- Push para `main` → Deploy para Produção
- Push para outras branches → Preview Deploy
- Pull Request → Automaticamente preview

## ✅ Verificação After Deploy

1. Teste a URL do seu app
2. Verifique o console (F12) para erros
3. Teste a conexão com a API (Network tab)
4. Verifique as variáveis de ambiente executando:
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL)
   ```

## 🔒 Segurança

- Nuca coloque valores reais nas variáveis públicas (VITE_*)
- Use variáveis de ambiente no Vercel, não no `.env` commitado
- O ficheiro `.env` está no `.gitignore` (não será subido)

## 📞 Dashboard Vercel

- **Logs:** Clique no deploy → **"Logs"**
- **Performance:** **"Analytics"**
- **Environment:** **"Settings"** → **"Environment Variables"**

## 🚀 Depois de Deploy

Atualize a variável **`FRONTEND_URL`** no Render com a URL do seu Vercel!