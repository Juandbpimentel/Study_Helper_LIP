const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
require('dotenv').config();

const adapter = new PrismaPg(
  new Pool({ connectionString: process.env.DATABASE_URL }),
);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const adminName = process.env.ADMIN_NAME ?? 'Administrador';

  const senhaHash = await bcrypt.hash(adminPassword, 10);

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      senha: senhaHash,
      nome: adminName,
      isAdmin: true,
      versaoToken: randomUUID(),
    },
    create: {
      email: adminEmail,
      senha: senhaHash,
      nome: adminName,
      isAdmin: true,
      versaoToken: randomUUID(),
    },
  });

  console.log(`Seed: admin criado/atualizado -> ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error('Erro ao rodar seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
