#!/usr/bin/env node
/*
  reset_prisma_db.js
  - Usa DATABASE_URL do backend/.env (dotenv) para conectar ao Postgres
  - Executa: DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;
  - Requer confirmação interativa (input "YES") ou passe --yes
*/

const path = require('path');
const fs = require('fs');

const DOTENV_PATH = path.resolve(__dirname, '../.env');
if (fs.existsSync(DOTENV_PATH)) {
  require('dotenv').config({ path: DOTENV_PATH });
}

const { Client } = require('pg');

async function main() {
  const args = process.argv.slice(2);
  const yes = args.includes('--yes') || args.includes('-y');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL não encontrado. Verifique backend/.env ou defina a variável.',
    );
    process.exit(2);
  }

  if (!yes) {
    process.stdout.write(
      'Este comando irá DROP & CREATE do schema \"public\" no banco apontado por DATABASE_URL.\n',
    );
    process.stdout.write(
      'Isto é IRREVERSÍVEL e removerá todo o conteúdo do banco (tables, dados, migrations tables, etc.).\n',
    );
    process.stdout.write('Digite YES para confirmar: ');

    const input = await new Promise((resolve) => {
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (d) => resolve(String(d).trim()));
    });

    if (input !== 'YES') {
      console.log('Aborted. Nenhuma alteração foi feita.');
      process.exit(0);
    }
  }

  console.log('Conectando ao banco...');
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Executando DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    // Opcional: recriar migration table/_prisma_migrations será criada pelo prisma migrate
    console.log('Schema public reiniciado com sucesso.');
    await client.end();
  } catch (err) {
    console.error('Falha ao resetar o schema:', err);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

main();
