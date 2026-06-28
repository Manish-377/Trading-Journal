import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  // Ensure uploads directory exists
  const uploadDir = configService.get<string>('UPLOAD_DIR') || './uploads';
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  const port = configService.get<number>('PORT') || 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`Trade Service running on port ${port}`);
}
bootstrap();
