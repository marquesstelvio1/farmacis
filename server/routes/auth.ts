import { Express, Request, Response } from "express";
import { db } from "../db";
import { users, registerSchema, loginSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate verification token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Send verification email
async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL || "http://localhost:5000"}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Farmácia <noreply@farmacia.com>",
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
  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Generate verification token
      const verificationToken = generateToken();

      // Auto-verify in development mode
      const isDevelopment = process.env.NODE_ENV === "development" || !process.env.SMTP_USER;

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          verificationToken: isDevelopment ? null : verificationToken,
          emailVerified: isDevelopment,
        })
        .returning();

      // Send verification email (only in production)
      if (!isDevelopment) {
        try {
          await sendVerificationEmail(validatedData.email, verificationToken);
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

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

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
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(
        validatedData.password,
        user.password
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Check if email is verified (skip in development if SMTP is not configured)
      if (!user.emailVerified) {
        // Auto-verify in development mode for easier testing
        if (process.env.NODE_ENV === "development" || !process.env.SMTP_USER) {
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
      if (error instanceof Error) {
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

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

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

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Perfil actualizado com sucesso", user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Erro ao actualizar perfil" });
    }
  });
}
