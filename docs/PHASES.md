# Trading Journal — Implementation Phases

---

## Phase 1 — Foundation (Infra + Auth)

- [ ] Docker Compose setup (PostgreSQL, Redis)
- [ ] API Gateway scaffold (NestJS + proxy + rate limiter)
- [ ] Auth Service (signup, login, refresh, logout)
- [ ] Angular app scaffold (routing, auth module, login/signup pages, auth interceptor, guards)

**End result:** You can register, login, and access protected routes.

---

## Phase 2 — Core Trade CRUD

- [ ] Trade Service scaffold (module, controller, service, repository)
- [ ] Trade CRUD (create, read, update, delete)
- [ ] Trade state machine (OPEN → CLOSED → REVIEWED)
- [ ] P&L Calculator (Strategy Pattern — equity first, add options/futures later)
- [ ] Screenshot upload (multer + local storage)
- [ ] Angular trade pages (form, list, detail)

**End result:** You can add trades manually, see them listed, upload screenshots.

---

## Phase 3 — Strategy + Mistakes + Rules

- [ ] Strategy CRUD + link to trades
- [ ] Mistake CRUD + link to trades
- [ ] Rule engine (define rules, auto-flag violations on trade creation)
- [ ] Angular pages for all three

**End result:** Full trade management with auto-violation detection.

---

## Phase 4 — Analytics + Caching

- [ ] Analytics Service scaffold
- [ ] Event publisher (Trade Service → Redis pub/sub)
- [ ] Event consumer (Analytics Service listens, updates aggregated stats)
- [ ] Dashboard endpoint (served from Redis cache)
- [ ] Performance, strategy breakdown, mistake breakdown endpoints
- [ ] Angular dashboard + charts

**End result:** Real-time dashboard with charts, event-driven stat updates.

---

## Phase 5 — Reports + CSV Import

- [ ] CSV import (parse, validate, batch insert, emit bulk event)
- [ ] Report generation (BullMQ background job)
- [ ] Report status polling + download
- [ ] Angular import page + reports page

**End result:** Full feature-complete app.

---

## Phase 6 — Polish

- [ ] Error handling standardization across all services
- [ ] Correlation ID (request tracing across services)
- [ ] Health check endpoints
- [ ] Dockerfiles per service
- [ ] Final Docker Compose (one command to run everything)
- [ ] Basic tests (unit tests for P&L calculator, state machine, rule engine)

**End result:** Production-ready, interview-presentable project.

---

## Phase Order Rationale

| Phase | Reasoning |
|-------|-----------|
| 1 first | Everything depends on auth + infra |
| 2 next | Core domain — most complex, needs time |
| 3 after | Builds on trades — just more CRUD + rule engine |
| 4 then | Needs trades to exist before analytics make sense |
| 5 last features | Nice-to-have, builds on everything above |
| 6 polish | Makes it production-ready and interview-presentable |



## Full Tech List Explained
## Backend
| Tech	| What it is	| Why we need it |
|-------|---------------|----------------|
| NestJS |	Node.js framework (like Angular but for backend) |Modules, DI, decorators — same concepts as Angular. Makes backend structured, not messy Express spaghetti. |
| Prisma |	ORM — talks to database for you |	Write TypeScript instead of raw SQL. Auto-generates types. Handles migrations. |
| JWT (jsonwebtoken) |	Library to create/verify tokens |	For authentication — user logs in, gets a token, sends it with every request. |
| bcrypt |	Password hashing library |	Never store plain passwords. This hashes them securely. |
BullMQ | Job queue library |	Runs background tasks (report generation) without blocking the API. Uses Redis under the hood. |
| Multer |	File upload middleware |	Handles multipart form data (screenshot uploads). |


## Frontend
|Tech	| What it is | Why we need it |
|-------|------------|----------------|
|Angular 17+ |	Frontend framework |You already know it. |
|ng2-charts / ECharts |	Charting library |	For analytics dashboards (line charts, bar charts, pie charts). |
|TailwindCSS (optional) |	Utility CSS framework |	Fast styling without writing custom CSS. Or use Angular Material if you prefer. |


## Infrastructure
|Tech	| What it is |	Why we need it |
|-------|------------|-----------------|
|PostgreSQL |	Database | Stores all your data (users, trades, analytics). Industry standard. |
|Redis	| In-memory data store |3 uses: caching dashboard stats, pub/sub events between services, job queue for BullMQ. |
|Docker |	Packages apps into containers |	Each service runs in its own isolated box. "Works on my machine" problem solved. |
|Docker Compose |	Runs multiple Docker containers together | One command docker-compose up starts |PostgreSQL + Redis + all 3 services. No manual setup. |