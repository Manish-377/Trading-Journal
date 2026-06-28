import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });
  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  console.log(`Analytics service running on port ${port}`);
}
bootstrap();
