import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { users } from './src/db/schema.js';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  await db.insert(users).values([
    {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: adminPassword,
      role: 'admin',
    },
    {
      name: 'John Student',
      email: 'user@demo.com',
      password: userPassword,
      role: 'user',
    },
  ]).onConflictDoNothing();

  console.log('✅ Seeded:');
  console.log('  Admin → admin@demo.com / admin123');
  console.log('  User  → user@demo.com  / user123');
  pool.end();
}

seed().catch(console.error);
