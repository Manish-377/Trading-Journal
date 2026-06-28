# Startup Guide

---

## First-Time Setup

### 1. Start Docker (PostgreSQL + Redis)
```powershell
cd "c:\Users\mn255055\Downloads\Projects\Trade  Journal"
docker-compose up -d
```

### 2. Install Dependencies
```powershell
cd auth-service && npm install && cd ..
cd trade-service && npm install && cd ..
cd analytics-service && npm install && cd ..
cd api-gateway && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Create Database Tables + Generate Prisma Clients
```powershell
cd auth-service
npx prisma migrate dev
cd ..

cd trade-service
npx prisma migrate dev
cd ..
```
> `prisma migrate dev` creates DB tables AND auto-runs `prisma generate`

### 4. Start All Services (each in a new terminal)
```powershell
# Terminal 1
cd auth-service && npm start

# Terminal 2
cd trade-service && npm start

# Terminal 3
cd analytics-service && npm start

# Terminal 4
cd api-gateway && npm start

# Terminal 5
cd frontend && npm start
```

### 5. Open Browser
```
http://localhost:4200
```

---

## Regular Startup (after reboot)

### 1. Docker (PostgreSQL + Redis)
```powershell
cd "c:\Users\mn255055\Downloads\Projects\Trade  Journal"
docker-compose up -d
```

### 2. Auth Service (port 3001)
```powershell
cd auth-service
npm start
```

### 3. Trade Service (port 3002) — new terminal
```powershell
cd trade-service
npx prisma generate   # only needed after npm install or schema changes
npm start
```

### 4. Analytics Service (port 3003) — new terminal
```powershell
cd analytics-service
npm start
```

### 5. API Gateway (port 3000) — new terminal
```powershell
cd api-gateway
npm start
```

### 6. Angular Frontend (port 4200) — new terminal
```powershell
cd frontend
npm start
```

### 7. Open Browser
```
http://localhost:4200
```

---

## Test via Terminal/Postman

```powershell
# Signup
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"Test1234!","name":"Test User"}'

# Login
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"Test1234!"}'

# Profile (use token from login)
$token = "<paste accessToken here>"
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers @{Authorization="Bearer $token"}
```

---

## Stop Everything
```powershell
# Ctrl+C in each terminal (auth, gateway, frontend)
docker-compose down          # stops Postgres + Redis (data persists)
docker-compose down -v       # stops AND deletes all data
```
