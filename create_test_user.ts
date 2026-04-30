import 'dotenv/config';
import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createTestUser() {
  const email = "test@example.com";
  const password = "123456";
  const name = "Usuário Teste";

  console.log(`🔍 Verificando se usuário ${email} já existe...`);

  try {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      console.log("✅ Usuário já existe.");
      console.log(`Email: ${existing[0].email}`);
      console.log(`Nome: ${existing[0].name}`);
    } else {
      console.log("➕ Criando novo usuário de teste...");
      await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
        emailVerified: true,
        role: "CLIENTE",
        phone: "351-912345678",
        address: "Rua Teste, 123"
      });
      console.log("✅ Usuário de teste criado com sucesso!");
      console.log(`📧 Email: ${email}`);
      console.log(`🔐 Senha: ${password}`);
    }
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
}

createTestUser().then(() => {
  console.log("✨ Pronto!");
  process.exit(0);
}).catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
