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

  // Configuração CORS para permitir cookies do frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // CRÍTICO: Permite envio de cookies
  });

  app.use(cookieParser());

  const port = process.env.PORT || 8080;

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
