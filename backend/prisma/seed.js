const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const adapter = new PrismaPg(
  new Pool({ connectionString: process.env.DATABASE_URL }),
);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seed: nenhum dado inicial configurado.');
}

main()
  .catch((err) => {
    console.error('Erro ao rodar seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
