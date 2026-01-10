import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 8080);

  const normalizeOrigin = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return new URL(trimmed).origin;
    } catch {
      return trimmed.replace(/\/+$/g, '');
    }
  };

  const tempAllowedOrigins: string[] = [];
  tempAllowedOrigins.push(process.env.FRONTEND_URL || '');
  tempAllowedOrigins.push(process.env.PUBLIC_API_URL || '');
  if (process.env.NODE_ENV === 'development') {
    tempAllowedOrigins.push('http://localhost:3000');
    tempAllowedOrigins.push(`http://localhost:${port}`);
    tempAllowedOrigins.push(`http://127.0.0.1:${port}`);
    tempAllowedOrigins.push('https://hoppscotch.io');
  }

  const allowedOrigins = Array.from(
    new Set(
      tempAllowedOrigins
        .map((origin) => normalizeOrigin(origin) ?? '')
        .filter((origin) => origin.length > 0),
    ),
  );

  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedRequestOrigin = normalizeOrigin(origin) ?? origin;
      if (allowedOrigins.includes(normalizedRequestOrigin)) {
        callback(null, true);
        return;
      }

      // Não derruba a API com 500 quando a origem não é permitida.
      // Sem os headers de CORS, o browser bloqueia a resposta naturalmente.
      callback(null, false);
    },
    credentials: true, // CRÍTICO: Permite envio de cookies
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.use(cookieParser());

  // Filtros globais: primeiro tratamos erros específicos do Prisma, depois o filtro genérico
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new GlobalExceptionFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Study Helper API')
    .setDescription('Documentação de API para a aplicação Study Helper')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(
    `A Aplicação está rodando na url seguinte: http://localhost:${port}`,
  );
  console.log(
    `A documentação utilizando o Swagger está disponível na url seguinte: http://localhost:${port}/docs`,
  );
}
void bootstrap();
