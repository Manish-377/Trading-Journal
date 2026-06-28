# Trading Journal — High Level Design (HLD)

---

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Client
        Angular[Angular App<br/>Port 4200]
    end

    subgraph API_Gateway[API Gateway - Port 3000]
        GW[NestJS Gateway]
        AuthGuard[Auth Guard<br/>JWT Validation]
        RateLimiter[Rate Limiter]
        Router[Request Router]
    end

    subgraph Auth_Service[Auth Service - Port 3001]
        AuthCtrl[Auth Controller]
        AuthSvc[Auth Service]
        TokenSvc[Token Service]
        AuthRepo[User Repository]
    end

    subgraph Trade_Service[Trade Service - Port 3002]
        TradeCtrl[Trade Controller]
        StratCtrl[Strategy Controller]
        MistakeCtrl[Mistake Controller]
        TradeSvc[Trade Service]
        RuleEngine[Rule Engine]
        PnLCalc[P&L Calculator<br/>Strategy Pattern]
        StateMachine[Trade State Machine]
        TradeRepo[Trade Repository]
        EventPublisher[Event Publisher]
    end

    subgraph Analytics_Service[Analytics Service - Port 3003]
        AnalyticsCtrl[Analytics Controller]
        ReportCtrl[Report Controller]
        StatsAggregator[Stats Aggregator]
        ReportGenerator[Report Generator]
        EventConsumer[Event Consumer]
        AnalyticsRepo[Analytics Repository]
    end

    subgraph Data_Layer[Data Layer]
        AuthDB[(Auth DB<br/>PostgreSQL)]
        TradeDB[(Trade DB<br/>PostgreSQL)]
        FileStore[(File Storage<br/>Local/S3)]
        AnalyticsDB[(Analytics DB<br/>PostgreSQL)]
        Redis[(Redis<br/>Cache + Pub/Sub + Queue)]
    end

    Angular -->|HTTP| GW
    GW --> AuthGuard
    AuthGuard --> RateLimiter
    RateLimiter --> Router

    Router -->|/auth/*| AuthCtrl
    Router -->|/trades/*<br/>/strategies/*<br/>/mistakes/*| TradeCtrl
    Router -->|/analytics/*<br/>/reports/*| AnalyticsCtrl

    AuthCtrl --> AuthSvc
    AuthSvc --> TokenSvc
    AuthSvc --> AuthRepo
    AuthRepo --> AuthDB

    TradeCtrl --> TradeSvc
    StratCtrl --> TradeSvc
    MistakeCtrl --> TradeSvc
    TradeSvc --> RuleEngine
    TradeSvc --> PnLCalc
    TradeSvc --> StateMachine
    TradeSvc --> TradeRepo
    TradeSvc --> EventPublisher
    TradeRepo --> TradeDB
    EventPublisher -->|Publish| Redis

    AnalyticsCtrl --> StatsAggregator
    ReportCtrl --> ReportGenerator
    EventConsumer -->|Subscribe| Redis
    EventConsumer --> StatsAggregator
    StatsAggregator --> AnalyticsRepo
    StatsAggregator -->|Read/Write Cache| Redis
    ReportGenerator -->|BullMQ Job| Redis
    AnalyticsRepo --> AnalyticsDB
```

---

## 2. Request Flow

### 2.1 Authentication Flow

```mermaid
sequenceDiagram
    participant C as Angular App
    participant GW as API Gateway
    participant AS as Auth Service
    participant DB as Auth DB
    participant R as Redis

    Note over C,R: SIGN UP
    C->>GW: POST /auth/signup {email, password, name}
    GW->>AS: Forward (no auth required)
    AS->>AS: Hash password (bcrypt)
    AS->>DB: Insert user
    AS->>AS: Generate access + refresh token
    AS->>R: Store refresh token (TTL 7d)
    AS-->>GW: {accessToken, refreshToken, user}
    GW-->>C: 201 Created

    Note over C,R: LOGIN
    C->>GW: POST /auth/login {email, password}
    GW->>AS: Forward
    AS->>DB: Find user by email
    AS->>AS: Compare password hash
    AS->>AS: Generate tokens
    AS->>R: Store refresh token
    AS-->>GW: {accessToken, refreshToken, user}
    GW-->>C: 200 OK

    Note over C,R: TOKEN REFRESH
    C->>GW: POST /auth/refresh {refreshToken}
    GW->>AS: Forward
    AS->>R: Validate refresh token exists
    AS->>AS: Generate new token pair
    AS->>R: Replace old refresh token
    AS-->>GW: {accessToken, refreshToken}
    GW-->>C: 200 OK

    Note over C,R: LOGOUT
    C->>GW: POST /auth/logout
    GW->>AS: Forward (with userId from JWT)
    AS->>R: Delete refresh token
    AS-->>GW: Success
    GW-->>C: 200 OK
```

### 2.2 Trade Creation Flow (Core Flow)

```mermaid
sequenceDiagram
    participant C as Angular App
    participant GW as API Gateway
    participant TS as Trade Service
    participant RE as Rule Engine
    participant PC as P&L Calculator
    participant SM as State Machine
    participant DB as Trade DB
    participant R as Redis
    participant AN as Analytics Service

    C->>GW: POST /trades (multipart: trade data + screenshots)
    GW->>GW: Validate JWT
    GW->>TS: Forward + userId

    TS->>TS: Validate & store images (local disk / S3)
    TS->>TS: Generate image URLs

    TS->>SM: Initialize state → OPEN (if no exit) or CLOSED (if exit provided)
    TS->>PC: Calculate P&L based on trade type
    Note over PC: Strategy Pattern:<br/>EquityCalc / OptionsCalc / FuturesCalc

    TS->>RE: Validate against user rules
    RE->>DB: Fetch user's rules
    RE->>RE: Evaluate conditions (risk %, time, etc.)
    RE-->>TS: {violations: [...]}

    TS->>DB: Insert trade + link violations as mistakes
    TS->>R: Publish "trade.created" event

    TS-->>GW: {trade, violations}
    GW-->>C: 201 Created (+ any rule violations flagged)

    Note over R,AN: ASYNC - Analytics Update
    R->>AN: Event: trade.created
    AN->>AN: Recalculate aggregated stats
    AN->>R: Update cached dashboard stats
```

### 2.3 Dashboard Load Flow

```mermaid
sequenceDiagram
    participant C as Angular App
    participant GW as API Gateway
    participant AN as Analytics Service
    participant R as Redis
    participant DB as Analytics DB

    C->>GW: GET /analytics/dashboard
    GW->>GW: Validate JWT
    GW->>AN: Forward + userId

    AN->>R: Check cache "dashboard:{userId}"
    
    alt Cache HIT
        R-->>AN: Cached stats
        AN-->>GW: Dashboard data
    else Cache MISS
        AN->>DB: Aggregate from stored stats
        AN->>R: Set cache "dashboard:{userId}" (TTL 5min)
        AN-->>GW: Dashboard data
    end

    GW-->>C: 200 OK {winRate, totalPnL, streak, recentTrades...}
```

### 2.4 CSV Import Flow

```mermaid
sequenceDiagram
    participant C as Angular App
    participant GW as API Gateway
    participant TS as Trade Service
    participant DB as Trade DB
    participant R as Redis
    participant AN as Analytics Service

    C->>GW: POST /trades/import (multipart/form-data CSV)
    GW->>GW: Validate JWT
    GW->>TS: Forward file + userId

    TS->>TS: Parse CSV rows
    TS->>TS: Validate each row schema
    
    loop For each valid row
        TS->>TS: Calculate P&L
        TS->>TS: Set state (CLOSED — imported trades are historical)
    end

    TS->>DB: Batch insert trades
    TS->>R: Publish "trades.bulk_imported" event

    TS-->>GW: {imported: 47, failed: 3, errors: [...]}
    GW-->>C: 200 OK

    R->>AN: Event: trades.bulk_imported
    AN->>AN: Full stat recalculation for user
    AN->>R: Invalidate + rebuild cache
```

---

## 3. API Contracts

### Auth Service APIs

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/signup` | `{email, password, name}` | `{accessToken, refreshToken, user}` |
| POST | `/auth/login` | `{email, password}` | `{accessToken, refreshToken, user}` |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/auth/logout` | — | `{message}` |
| GET | `/auth/me` | — | `{user}` |

### Trade Service APIs

| Method | Endpoint | Body/Params | Response |
|--------|----------|-------------|----------|
| POST | `/trades` | `multipart: {symbol, type, direction, entryPrice, exitPrice, quantity, strategyId, notes, tags, screenshots[]}` | `{trade, violations}` |
| POST | `/trades/:id/screenshots` | `multipart: screenshots[] (PNG/JPG/JPEG/WebP, max 5MB each, max 5 per trade)` | `{imageUrls[]}` |
| DELETE | `/trades/:id/screenshots/:imageId` | — | `{message}` |
| GET | `/trades` | `?page, limit, status, strategy, dateFrom, dateTo, symbol` | `{trades[], total, page}` |
| GET | `/trades/:id` | — | `{trade}` |
| PATCH | `/trades/:id` | Partial trade fields | `{trade}` |
| PATCH | `/trades/:id/close` | `{exitPrice, closedAt}` | `{trade}` |
| PATCH | `/trades/:id/review` | `{notes, mistakeIds}` | `{trade}` |
| DELETE | `/trades/:id` | — | `{message}` |
| POST | `/trades/import` | CSV file (multipart) | `{imported, failed, errors}` |
| | | | |
| POST | `/strategies` | `{name, description, rules}` | `{strategy}` |
| GET | `/strategies` | — | `{strategies[]}` |
| PATCH | `/strategies/:id` | Partial fields | `{strategy}` |
| DELETE | `/strategies/:id` | — | `{message}` |
| | | | |
| POST | `/mistakes` | `{name, category, description}` | `{mistake}` |
| GET | `/mistakes` | — | `{mistakes[]}` |
| PATCH | `/mistakes/:id` | Partial fields | `{mistake}` |
| DELETE | `/mistakes/:id` | — | `{message}` |
| | | | |
| POST | `/rules` | `{name, conditionType, operator, value, action}` | `{rule}` |
| GET | `/rules` | — | `{rules[]}` |
| DELETE | `/rules/:id` | — | `{message}` |

### Analytics Service APIs

| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/analytics/dashboard` | — | `{totalPnL, winRate, avgRR, currentStreak, totalTrades, recentTrades[]}` |
| GET | `/analytics/performance` | `?period=daily/weekly/monthly&from&to` | `{dataPoints[{date, pnl, cumulative}]}` |
| GET | `/analytics/strategies` | — | `{strategies[{name, winRate, avgPnL, tradeCount}]}` |
| GET | `/analytics/mistakes` | — | `{mistakes[{category, count, totalLoss}]}` |
| GET | `/analytics/patterns` | — | `{byDayOfWeek[], byHour[], byHoldTime[]}` |
| POST | `/reports/generate` | `{type: weekly/monthly, dateRange}` | `{jobId}` |
| GET | `/reports/:jobId/status` | — | `{status, downloadUrl}` |
| GET | `/reports` | — | `{reports[]}` |

---

## 4. Event Contracts (Redis Pub/Sub)

| Event | Published By | Consumed By | Payload |
|-------|-------------|-------------|---------|
| `trade.created` | Trade Service | Analytics Service | `{userId, tradeId, pnl, type, strategyId, closedAt}` |
| `trade.updated` | Trade Service | Analytics Service | `{userId, tradeId, oldPnl, newPnl, strategyId}` |
| `trade.closed` | Trade Service | Analytics Service | `{userId, tradeId, pnl, strategyId, closedAt}` |
| `trade.deleted` | Trade Service | Analytics Service | `{userId, tradeId, pnl, strategyId}` |
| `trades.bulk_imported` | Trade Service | Analytics Service | `{userId, count}` |
| `report.generate` | Analytics Controller | Report Worker (BullMQ) | `{userId, type, dateRange}` |

---

## 5. Caching Strategy

| Cache Key | Data | TTL | Invalidated By |
|-----------|------|-----|----------------|
| `dashboard:{userId}` | Aggregated dashboard stats | 5 min | `trade.created/updated/deleted/closed` |
| `performance:{userId}:{period}` | Performance chart data | 10 min | `trade.*` events |
| `strategies:{userId}` | Strategy list with computed win rates | 10 min | `trade.*` events, strategy CRUD |

**Invalidation approach:** On any `trade.*` event, delete relevant cache keys for that userId. Next read triggers fresh computation and re-caches.

---

## 6. Service Communication Summary

```mermaid
graph LR
    subgraph Synchronous
        GW[Gateway] -->|HTTP| Auth[Auth Service]
        GW -->|HTTP| Trade[Trade Service]
        GW -->|HTTP| Analytics[Analytics Service]
    end

    subgraph Asynchronous
        Trade -->|Redis Pub/Sub| Analytics
        Analytics -->|BullMQ Job| ReportWorker[Report Worker]
    end
```

- **Sync (HTTP):** Client-facing requests that need immediate response
- **Async (Events):** Background work that can tolerate 1-2 second delay (stat recalculation, report generation)

---

## 7. Deployment View

```mermaid
graph TD
    subgraph Docker_Compose[Docker Compose - Local Dev]
        NG[Angular Dev Server<br/>:4200]
        GW[API Gateway<br/>:3000]
        AS[Auth Service<br/>:3001]
        TS[Trade Service<br/>:3002]
        ANS[Analytics Service<br/>:3003]
        PG1[(PostgreSQL<br/>:5432)]
        RD[(Redis<br/>:6379)]
    end

    NG --> GW
    GW --> AS
    GW --> TS
    GW --> ANS
    AS --> PG1
    TS --> PG1
    ANS --> PG1
    TS --> RD
    ANS --> RD
```

Each service has its own database schema (logical separation within same PostgreSQL instance for local dev — separate instances in production).

---

## 8. Non-Functional Requirements

| Aspect | Decision |
|--------|----------|
| Auth | JWT (15min expiry) + refresh token (7 day, stored in Redis) |
| Rate Limiting | 100 requests/minute per user on Gateway |
| Pagination | Cursor-based for trade history, page-based for reports |
| File Upload | Max 5MB CSV; Screenshots: max 5MB per image, max 5 per trade (PNG, JPG, JPEG, WebP) |
| File Storage | Local disk in dev, S3-compatible (MinIO/AWS S3) in prod. Files stored by userId/tradeId path. |
| Error Handling | Standardized error response format across all services |
| Logging | Structured JSON logs with correlation ID across services |
| Health Checks | Each service exposes `/health` endpoint |
