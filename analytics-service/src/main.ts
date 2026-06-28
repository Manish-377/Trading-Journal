import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  console.log(`Analytics service running on port ${port}`);
}
bootstrap();
