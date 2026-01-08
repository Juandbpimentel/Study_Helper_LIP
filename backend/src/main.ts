import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

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
  const tempAllowedOrigins: string[] = [];
  tempAllowedOrigins.push(process.env.FRONTEND_URL || '');
  tempAllowedOrigins.push(process.env.PUBLIC_API_URL || '');
  if (process.env.NODE_ENV === 'development') {
    tempAllowedOrigins.push('http://localhost:3000');
    tempAllowedOrigins.push(`http://localhost:${port}`);
    tempAllowedOrigins.push(`http://127.0.0.1:${port}`);
    tempAllowedOrigins.push('https://hoppscotch.io');
  }
  const allowedOrigins: string[] = tempAllowedOrigins.filter(
    (origin) => origin && origin.length > 0,
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
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true, // CRÍTICO: Permite envio de cookies
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.use(cookieParser());

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
