import bcrypt from 'bcryptjs';
import readline from 'readline';
import { getDb } from '../config/db';
import { env } from '../config/env';
import { runMigrations } from '../../database/migrate';
import { logAudit } from '../services/auditService';
import { validateStrongPassword } from '../services/sanitizeService';

function askQuestion(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function runSetup(): Promise<void> {
  runMigrations();
  const db = getDb();

  const existing = db
    .prepare("SELECT id, email FROM users WHERE role = 'super_admin'")
    .get() as { id: number; email: string } | undefined;

  if (existing) {
    console.log(`[Setup] Idempotent check: Super Admin already provisioned (${existing.email}). Exiting cleanly.`);
    process.exit(0);
  }

  let name = process.env.INITIAL_ADMIN_NAME || 'Shaheed Admin';
  let password = process.env.INITIAL_ADMIN_PASSWORD || '';

  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(`\nCasid Pharma Initial Super Admin Setup`);
    console.log(`Designated Super Admin Email: ${env.initialAdminEmail}\n`);
    const inputName = await askQuestion(rl, `Full Name [${name}]: `);
    if (inputName.trim()) name = inputName.trim();
    password = await askQuestion(rl, 'Enter strong password (min 8 chars, upper, lower, number, symbol): ');
    rl.close();
  }

  const check = validateStrongPassword(password);
  if (!check.valid) {
    console.error(`[Setup] Error: ${check.message}`);
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 12);
  const info = db
    .prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'super_admin', 'active')
    `)
    .run(name, env.initialAdminEmail, hash);

  logAudit({
    userId: Number(info.lastInsertRowid),
    userEmail: env.initialAdminEmail,
    action: 'INITIAL_SUPER_ADMIN_PROVISIONED',
    entityType: 'user',
    entityId: Number(info.lastInsertRowid),
    details: 'Provisioned initial Super Admin via CLI setup script.',
    ipAddress: '127.0.0.1',
  });

  console.log(`[Setup] Super Admin (${env.initialAdminEmail}) provisioned successfully.`);
}

runSetup().catch((err) => {
  console.error('[Setup] Failed:', err);
  process.exit(1);
});
