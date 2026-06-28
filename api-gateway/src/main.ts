import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();

  // Express strips the mount path, so /api/auth/login → req.url = /login
  // Target includes /auth so it becomes http://localhost:3001/auth/login
  expressApp.use('/api/auth', createProxyMiddleware({
    target: 'http://localhost:3001/auth',
    changeOrigin: true,
  }));

  expressApp.use('/api/trades', createProxyMiddleware({
    target: 'http://localhost:3002/trades',
    changeOrigin: true,
  }));

  expressApp.use('/api/strategies', createProxyMiddleware({
    target: 'http://localhost:3002/strategies',
    changeOrigin: true,
  }));

  expressApp.use('/api/mistakes', createProxyMiddleware({
    target: 'http://localhost:3002/mistakes',
    changeOrigin: true,
  }));

  expressApp.use('/api/rules', createProxyMiddleware({
    target: 'http://localhost:3002/rules',
    changeOrigin: true,
  }));

  expressApp.use('/api/analytics', createProxyMiddleware({
    target: 'http://localhost:3003/analytics',
    changeOrigin: true,
  }));

  expressApp.use('/api/dashboard', createProxyMiddleware({
    target: 'http://localhost:3003/dashboard',
    changeOrigin: true,
  }));

  expressApp.use('/api/reports', createProxyMiddleware({
    target: 'http://localhost:3003/reports',
    changeOrigin: true,
  }));

  await app.listen(3000);
}
bootstrap();
