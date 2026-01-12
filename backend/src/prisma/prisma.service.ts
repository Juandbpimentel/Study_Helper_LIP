import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly pool: Pool;
  user: any;
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não definido. Verifique o .env.');
    }

    const pool = new Pool({
      connectionString,
      // Valores configuráveis via env vars com defaults seguros
      max: Number(process.env.PRISMA_POOL_MAX ?? 20),
      connectionTimeoutMillis: Number(
        process.env.PRISMA_CONNECTION_TIMEOUT_MS ?? 5000,
      ),
      idleTimeoutMillis: Number(process.env.PRISMA_IDLE_TIMEOUT_MS ?? 30000),
    });

    // Definir statement_timeout para evitar queries travadas afetando o pool
    pool.on('connect', (client) => {
      const stmtTimeout = Number(
        process.env.PRISMA_STATEMENT_TIMEOUT_MS ?? 15000,
      );
      void client.query(`SET statement_timeout = ${stmtTimeout}`);
    });

    // Log de erro de pool (melhora diagnóstico)
    pool.on('error', (err) => {
      console.error('PG Pool error:', err?.message ?? err);
    });

    const adapter = new PrismaPg(pool);
    super({ errorFormat: 'minimal', adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
