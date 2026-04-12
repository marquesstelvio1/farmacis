import { Express, Request, Response } from "express";
import { db } from "../db";
import { users, registerSchema, loginSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Armazenamento temporário de OTPs (em produção, usar Redis ou similar)
const otps = new Map<string, string>();

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

// Verificar conexão SMTP no arranque
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erro de Configuração SMTP (E-mail):", error.message);
    if (error.message.includes("credential")) {
      console.error("ERRO: As credenciais EMAIL_USER ou EMAIL_PASS estão vazias no arquivo .env.");
    }
    console.log("DICA: Certifique-se de que está a usar uma 'Senha de App' do Google.");
  } else {
    console.log("✅ Servidor de E-mail pronto para enviar mensagens");
  }
});

// Generate verification token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Send verification email
async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL || "http://localhost:5000"}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Farmácis" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verifique seu email",
    html: `
      <h1>Bem-vindo à Farmácia!</h1>
      <p>Por favor, clique no link abaixo para verificar seu email:</p>
      <a href="${verificationUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verificar Email
      </a>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p>${verificationUrl}</p>
    `,
  });
}

export function registerAuthRoutes(app: Express) {
  // Health Check para o Render
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString() 
    });
  });

  // Rota de Teste para verificar configuração de e-mail
  app.get("/api/auth/test-email", async (req: Request, res: Response) => {
    try {
      console.log("Tentando enviar e-mail de teste...");
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Farmácis Teste" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER as string,
        subject: "Teste de Configuração SMTP - Farmácis",
        text: "Olá! Se você recebeu este e-mail, a configuração do Nodemailer com o Gmail está funcionando corretamente.",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 2px solid #2563eb; border-radius: 10px;">
            <h2 style="color: #2563eb;">Sucesso!</h2>
            <p>A configuração do servidor SMTP para <b>stelvio715@gmail.com</b> está ativa.</p>
            <p style="font-size: 12px; color: #64748b;">Enviado em: ${new Date().toLocaleString()}</p>
          </div>
        `,
      });
      res.json({ message: "E-mail de teste enviado com sucesso para stelvio715@gmail.com" });
    } catch (error) {
      console.error("Erro no teste de e-mail:", error);
      res.status(500).json({ 
        message: "Falha ao enviar e-mail de teste", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Enviar Código OTP via Email (Nodemailer)
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email é obrigatório" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otps.set(email, otp);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Farmácis Verificação" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} é o seu código de verificação`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #1e3a8a;">Validação de Conta - Farmácis</h2>
            <p>Utilize o código abaixo para confirmar a sua identidade:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; margin: 20px 0;">${otp}</div>
            <p style="color: #64748b; font-size: 12px;">Se não solicitou este código, por favor ignore este email.</p>
          </div>
        `,
      });

      res.json({ message: "Código enviado com sucesso" });
    } catch (error) {
      // Log detalhado para ajudar no diagnóstico
      console.error("Erro detalhado do Nodemailer:", error);
      res.status(500).json({ 
        message: "Falha ao enviar código por email",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Verificar Código OTP
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email e código são obrigatórios" });
      }

      const storedOtp = otps.get(email);

      if (storedOtp && storedOtp === otp) {
        otps.delete(email); // Remove o código após sucesso
        res.json({ message: "Código verificado com sucesso" });
      } else {
        res.status(400).json({ message: "Código de verificação inválido ou expirado" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar código" });
    }
  });

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const normalizedEmail = validatedData.email.trim().toLowerCase();

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Generate verification token
      const verificationToken = generateToken();

      // Auto-verify in development mode
      const isDevelopment = process.env.NODE_ENV === "development" || !process.env.EMAIL_USER;

      // Create user
      const result = await db
        .insert(users)
        .values({
          name: validatedData.name,
          email: normalizedEmail,
          password: hashedPassword,
          verificationToken: isDevelopment ? null : verificationToken,
          emailVerified: isDevelopment,
        })
        .returning();

      if (result.length === 0) throw new Error("Failed to create user");
      const newUser = result[0];

      // Send verification email (only in production)
      if (!isDevelopment) {
        try {
          await sendVerificationEmail(normalizedEmail, verificationToken);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }
      }

      res.status(201).json({
        message: "Usuário criado com sucesso. Por favor, verifique seu email.",
        userId: newUser.id,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao criar usuário" });
      }
    }
  });

  // Verify email
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token inválido" });
      }

      const result = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (result.length === 0) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      const user = result[0];

      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Email verificado com sucesso!" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao verificar email" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt:", req.body);
      
      const validatedData = loginSchema.parse(req.body);
      const normalizedEmail = validatedData.email.trim().toLowerCase();
      console.log("Validated data:", validatedData);

      // Find user
      console.log("Querying database for user:", normalizedEmail);
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      
      const user = result.length > 0 ? result[0] : undefined;
      
      console.log("User found:", user ? "yes" : "no");

      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Check password
      console.log("Comparing passwords...");
      const isValidPassword = await bcrypt.compare(
        validatedData.password,
        user.password
      );
      
      console.log("Password valid:", isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Check if email is verified (skip in development if SMTP is not configured)
      if (!user.emailVerified) {
        // Auto-verify in development mode for easier testing
        if (process.env.NODE_ENV === "development" || !process.env.EMAIL_USER) {
          console.log("Auto-verifying email in development mode");
          await db
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, user.id));
        } else {
          return res.status(401).json({
            message: "Por favor, verifique seu email antes de fazer login",
          });
        }
      }

      // Create session (in production, use JWT or session store)
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Login error details:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro ao fazer login" });
      }
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const user = result.length > 0 ? result[0] : undefined;

      if (!user || user.emailVerified) {
        return res.status(400).json({ message: "Email inválido ou já verificado" });
      }

      const verificationToken = generateToken();

      await db
        .update(users)
        .set({ verificationToken })
        .where(eq(users.id, user.id));

      await sendVerificationEmail(email, verificationToken);

      res.json({ message: "Email de verificação reenviado" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao reenviar email" });
    }
  });

  // Update user profile (phone, name)
  app.patch("/api/auth/profile", async (req: Request, res: Response) => {
    try {
      const { userId, phone, name, address } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID é obrigatório" });
      }

      const updateData: Record<string, any> = {};
      if (phone) updateData.phone = phone.replace(/\s/g, ""); // strip spaces
      if (name) updateData.name = name;
      if (address) updateData.address = address;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Nenhum dado para actualizar" });
      }

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }
      const updatedUser = result[0];

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Perfil actualizado com sucesso", user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Erro ao actualizar perfil" });
    }
  });
}
