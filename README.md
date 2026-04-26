# Farmácis - Sistema de Farmácias Online

Sistema completo para gestão de farmácias online com múltiplas interfaces: cliente, administração e farmácias.

## 🚀 Deploy em Produção

Para fazer deploy em produção, recomendamos usar **Vercel** (Frontend) e **Render** (Backend).

### 📋 Verificação Pré-Deploy

Execute o script de verificação antes do deploy:

```bash
./check-deploy.sh
```

Este script verifica:
- ✅ Variáveis de ambiente obrigatórias
- ✅ Build do projeto
- ✅ Conexão TypeScript

### 🏗️ Deploy Automático

#### Backend (Render)
1. Conecte seu repositório Git ao [Render](https://render.com)
2. Use as configurações do `render.yaml` incluído
3. Configure as variáveis de ambiente (veja `.env.example`)
4. O deploy será automático a cada push

#### Frontend (Vercel)
1. Conecte seu repositório Git ao [Vercel](https://vercel.com)
2. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Configure `VITE_API_URL` com a URL do seu backend no Render

### 📖 Documentação Completa

Para instruções detalhadas de deploy, consulte [`DEPLOY.md`](./DEPLOY.md).

## 🏠 Hospedagem Local

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- Conta Stripe (pagamentos)
- Conta OpenAI (IA para identificação de medicamentos)
- Servidor com pelo menos 1GB RAM

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone <seu-repositorio>
cd farmacis

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações reais
```

### 2. Configuração do Banco de Dados

```bash
# Execute as migrações do banco
npm run db:push

# (Opcional) Execute o seeding inicial
npm run dev:server
# O seeding roda automaticamente na primeira inicialização
```

### 3. Build de Produção

```bash
# Build da aplicação
npm run build

# O build gera:
# - dist/index.cjs (servidor)
# - dist/public/ (arquivos estáticos do cliente)
```

### 4. Inicialização em Produção

#### Opção 1: Executar diretamente
```bash
# Inicie o servidor
npm start

# Ou use PM2 para produção
npm install -g pm2
pm2 start dist/index.cjs --name farmacis
pm2 save
pm2 startup
```

#### Opção 2: Usando Docker
```bash
# Build e execução com Docker
docker-compose up -d

# Ou apenas com Docker
docker build -t farmacis .
docker run -p 5001:5001 --env-file .env farmacis
```

#### Opção 3: Script de Deploy
```bash
# Executar script de deploy (Linux/Mac)
chmod +x deploy.sh
./deploy.sh
```

### 5. Configurações de Produção

#### Nginx (Recomendado)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL com Let's Encrypt

```bash
# Instale certbot
sudo apt install certbot python3-certbot-nginx

# Configure SSL
sudo certbot --nginx -d yourdomain.com
```

### 6. Usando Docker

O projeto inclui configurações Docker completas para facilitar a hospedagem.

#### Arquivos Docker incluídos:
- `Dockerfile` - Build da aplicação
- `docker-compose.yml` - Orquestração com PostgreSQL
- `.dockerignore` - Otimização do build

#### Executar com Docker Compose:
```bash
# Iniciar aplicação e banco
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

#### Variáveis de ambiente no Docker:
Configure as variáveis no arquivo `.env` ou passe via `docker-compose.yml`:
```yaml
environment:
  - DATABASE_URL=postgresql://farmacis:farmacis@db:5432/farmacis
  - OPENAI_API_KEY=your_key
  - STRIPE_SECRET_KEY=your_key
  # ... outras variáveis
```

### 7. Monitoramento

```bash
# Logs do PM2
pm2 logs farmacis

# Status do PM2
pm2 status

# Reiniciar aplicação
pm2 restart farmacis
```

## 🔧 Configurações Importantes

### Variáveis de Ambiente

- `DATABASE_URL`: URL completa do PostgreSQL
- `OPENAI_API_KEY`: Chave da API OpenAI
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe
- `SMTP_*`: Configurações de email
- `APP_URL`: URL completa da aplicação
- `SESSION_SECRET`: Chave secreta para sessões

### Banco de Dados

- Use PostgreSQL em produção
- Configure `sslmode=require` na URL
- Certifique-se de backups regulares

### Segurança

- Mantenha `NODE_ENV=production`
- Use HTTPS em produção
- Configure firewall
- Monitore logs regularmente

## 📱 Interfaces Disponíveis

- **Cliente**: `https://yourdomain.com` (porta padrão)
- **Admin**: `https://yourdomain.com/admin`
- **Farmácia**: `https://yourdomain.com/farmacia`

## 🐛 Troubleshooting

### Problema: Aplicação não inicia
```bash
# Verifique variáveis de ambiente
cat .env

# Verifique conexão com banco
npm run db:push

# Verifique logs
npm start 2>&1 | tee logs.txt
```

### Problema: Erro de CORS
- Verifique `APP_URL` no .env
- Certifique-se que o domínio está correto

### Problema: Upload de imagens não funciona
- Verifique permissões da pasta `uploads/`
- Configure `MAX_FILE_SIZE` adequadamente

## 📞 Suporte

Para problemas específicos, verifique os logs da aplicação e certifique-se que todas as variáveis de ambiente estão configuradas corretamente.