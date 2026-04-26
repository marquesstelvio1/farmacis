// Diagnostic script to check users vs admin_users tables
import { db } from './server/db';
import { users, adminUsers } from './shared/schema';

async function checkUsers() {
  console.log('=== DIAGNÓSTICO DE USUÁRIOS ===\n');
  
  // Check regular users
  const allUsers = await db.select().from(users);
  console.log(`📊 Total de Usuários Comuns: ${allUsers.length}`);
  console.log('Usuários:', allUsers.map(u => ({ 
    id: u.id, 
    name: u.name, 
    email: u.email 
  })));
  
  console.log('\n---\n');
  
  // Check admin users
  const allAdmins = await db.select().from(adminUsers);
  console.log(`👥 Total de Administradores: ${allAdmins.length}`);
  console.log('Administradores:', allAdmins.map(a => ({ 
    id: a.id, 
    name: a.name, 
    email: a.email,
    role: a.role 
  })));
  
  console.log('\n=== VERIFICAÇÃO DE DUPLICAÇÃO ===');
  
  // Check for duplicate emails
  const user_emails = new Set(allUsers.map(u => u.email));
  const admin_emails = new Set(allAdmins.map(a => a.email));
  
  const duplicates = [...user_emails].filter(email => admin_emails.has(email));
  
  if (duplicates.length > 0) {
    console.log('⚠️  Emails duplicados (estão em ambas as tabelas):');
    duplicates.forEach(email => console.log(`   - ${email}`));
  } else {
    console.log('✅ Sem duplicação de emails entre usuários e administradores');
  }
  
  process.exit(0);
}

checkUsers().catch(console.error);
