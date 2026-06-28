import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  
  const allowedOrigins = process.env.CORS_ORIGIN || 'http://localhost:4200';
  app.enableCors({
    origin: allowedOrigins.split(','),
    credentials: true,
  });

  const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  const TRADE_URL = process.env.TRADE_SERVICE_URL || 'http://localhost:3002';
  const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003';

  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use('/api/auth', createProxyMiddleware({
    target: `${AUTH_URL}/auth`,
    changeOrigin: true,
  }));

  expressApp.use('/api/trades', createProxyMiddleware({
    target: `${TRADE_URL}/trades`,
    changeOrigin: true,
  }));

  expressApp.use('/api/strategies', createProxyMiddleware({
    target: `${TRADE_URL}/strategies`,
    changeOrigin: true,
  }));

  expressApp.use('/api/mistakes', createProxyMiddleware({
    target: `${TRADE_URL}/mistakes`,
    changeOrigin: true,
  }));

  expressApp.use('/api/rules', createProxyMiddleware({
    target: `${TRADE_URL}/rules`,
    changeOrigin: true,
  }));

  expressApp.use('/api/analytics', createProxyMiddleware({
    target: `${ANALYTICS_URL}/analytics`,
    changeOrigin: true,
  }));

  expressApp.use('/api/dashboard', createProxyMiddleware({
    target: `${ANALYTICS_URL}/dashboard`,
    changeOrigin: true,
  }));

  expressApp.use('/api/reports', createProxyMiddleware({
    target: `${ANALYTICS_URL}/reports`,
    changeOrigin: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
