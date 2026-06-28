# Phase 1 — Foundation (Infra + Auth)

## 1. Install NestJS CLI
```powershell
npm install -g @nestjs/cli
```

## 2. Start Infrastructure
```powershell
docker-compose up -d    # PostgreSQL + Redis
```

## 3. Scaffold Services
```powershell
nest new api-gateway --package-manager npm --skip-git
nest new auth-service --package-manager npm --skip-git
nest new trade-service --package-manager npm --skip-git
nest new analytics-service --package-manager npm --skip-git
ng new frontend --routing --style=scss --standalone --skip-git --ssr=false
```

## 4. Auth Service — Install Dependencies
```powershell
cd auth-service
npm install prisma @prisma/client @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer ioredis @nestjs/config
npm install -D @types/bcrypt @types/passport-jwt
npm install @prisma/adapter-pg pg
npm install -D @types/pg
```

## 5. Auth Service — Prisma Setup
```powershell
cd auth-service
npx prisma init
npx prisma generate
npx prisma migrate dev --name init
```

## 6. API Gateway — Install Dependencies
```powershell
cd api-gateway
npm install @nestjs/config http-proxy-middleware @nestjs/throttler @nestjs/platform-express
```

## 7. Build & Run
```powershell
# Auth Service (port 3001)
cd auth-service
npx nest build; node dist/main.js

# API Gateway (port 3000)
cd api-gateway
npx nest build; node dist/main.js
```
