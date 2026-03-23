# 📧 Configuração de Envio de Email

## Quem envia os emails?

O sistema usa **Nodemailer** com servidor SMTP para envio de emails de verificação.

## Opções de Configuração

### 1️⃣ **Gmail (Recomendado para Desenvolvimento)**

#### Passo 1: Criar Senha de App no Gmail
1. Acesse sua conta Google: https://myaccount.google.com/
2. Vá em **Segurança**
3. Ative **Verificação em duas etapas** (se não estiver ativa)
4. Vá em **Senhas de app**: https://myaccount.google.com/apppasswords
5. Selecione:
   - **App**: Mail
   - **Dispositivo**: Other (Windows)
6. Clique em **Gerar**
7. Copie a senha de 16 caracteres (ex: `abcd efgh ijkl mnop`)

#### Passo 2: Configurar no `.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Senha de app (sem espaços)
SMTP_FROM="Farmácia <seu-email@gmail.com>"
APP_URL=http://localhost:5175
```

---

### 2️⃣ **Outlook/Hotmail**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM="Farmácia <seu-email@outlook.com>"
```

---

### 3️⃣ **Yahoo Mail**

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=seu-email@yahoo.com
SMTP_PASS=sua-senha-de-app  # Também requer senha de app
SMTP_FROM="Farmácia <seu-email@yahoo.com>"
```

---

### 4️⃣ **SMTP Profissional (Produção)**

Exemplos: SendGrid, Mailgun, Amazon SES, etc.

#### SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxx
SMTP_FROM="Farmácia <noreply@farmacia.com>"
```

---

## 📝 Emails Enviados pelo Sistema

### 1. **Verificação de Email** (Registro)
- **Assunto:** "Verifique seu email"
- **Conteúdo:** Link de verificação com token
- **Quando:** Ao criar nova conta

### 2. **Recuperação de Senha** (Futuro)
- **Assunto:** "Recupere sua senha"
- **Conteúdo:** Link para resetar senha
- **Quando:** Usuário solicita recuperação

---

## 🧪 Testando o Envio

### Modo de Desenvolvimento

Se **não** configurar SMTP, o sistema:
- ✅ **Auto-verifica** emails em desenvolvimento
- ✅ Não envia email real
- ✅ Mostra mensagem: "Conta criada com sucesso! Verifique seu email"

### Modo de Produção

Com SMTP configurado:
- ✅ Envia email real de verificação
- ✅ Token válido por 24 horas
- ✅ Link seguro com hash criptografado

---

## 🔧 Código de Envio (Para Referência)

Localização: `server/routes/auth.ts`

```typescript
// Enviar email de verificação
await transporter.sendMail({
  from: process.env.SMTP_FROM || "Farmácia <noreply@farmacia.com>",
  to: email,
  subject: "Verifique seu email",
  html: `
    <h1>Bem-vindo à Farmácia!</h1>
    <p>Clique no link para verificar:</p>
    <a href="${verificationUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
      Verificar Email
    </a>
  `,
});
```

---

## ⚠️ Importante

### Para Desenvolvimento Local:
- Use**Gmail com senha de app** (mais fácil)
- Ou deixe sem configurar (auto-verificação)

### Para Produção:
- Use serviço profissional (SendGrid, Mailgun, AWS SES)
- Configure domínio próprio nos DNS records
- Use variáveis de ambiente seguras

---

## 🛠️ Troubleshooting

### Erro: "Invalid Login"
- ✅ Verifique se usou **senha de app**, não senha normal
- ✅ Remova espaços da senha de app no `.env`
- ✅ Confira se 2FA está ativo na conta Google

### Erro: "Connection Timeout"
- ✅ Verifique firewall/antivírus
- ✅ Tente porta 465 com `secure: true`
- ✅ Teste conectividade: `telnet smtp.gmail.com 587`

### Emails indo para Spam:
- ✅ Use domínio próprio em produção
- ✅ Configure SPF, DKIM, DMARC
- ✅ Evite enviar muitos emails de uma vez

---

## 📚 Recursos Úteis

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Free Tier](https://sendgrid.com/free/)

---

**Próximos Passos:**
1. Escolha provedor de email
2. Gere credenciais (senha de app ou API key)
3. Atualize `.env` com suas credenciais
4. Reinicie o servidor: `npm run dev:all`
5. Teste registro de usuário
