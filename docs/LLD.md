# Trading Journal — Low Level Design (LLD)

---

## 1. Database Schema

### 1.1 Auth Service Database

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        timestamp created_at
        timestamp updated_at
    }
```

**Redis Keys (Auth):**
```
refresh_token:{userId}:{tokenId} → {token, expiresAt}   TTL: 7 days
```

---

### 1.2 Trade Service Database

```mermaid
erDiagram
    trades {
        uuid id PK
        uuid user_id FK
        varchar symbol
        enum trade_type "EQUITY | OPTIONS | FUTURES"
        enum direction "LONG | SHORT"
        enum status "OPEN | CLOSED | REVIEWED"
        decimal entry_price
        decimal exit_price
        decimal quantity
        decimal stop_loss
        decimal take_profit
        decimal pnl
        decimal fees
        decimal risk_reward_ratio
        uuid strategy_id FK
        text notes
        varchar[] tags
        timestamp opened_at
        timestamp closed_at
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    trade_images {
        uuid id PK
        uuid trade_id FK
        varchar file_path
        varchar original_name
        varchar mime_type
        int file_size
        timestamp created_at
    }

    strategies {
        uuid id PK
        uuid user_id FK
        varchar name
        text description
        timestamp created_at
        timestamp updated_at
    }

    mistakes {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar category
        text description
        timestamp created_at
    }

    trade_mistakes {
        uuid id PK
        uuid trade_id FK
        uuid mistake_id FK
        text notes
        timestamp created_at
    }

    rules {
        uuid id PK
        uuid user_id FK
        varchar name
        enum condition_type "MAX_RISK_PERCENT | MIN_RR_RATIO | TRADING_HOURS | MAX_DAILY_TRADES | MAX_POSITION_SIZE"
        varchar operator "GT | LT | EQ | BETWEEN | NOT_BETWEEN"
        varchar value
        enum action "WARN | BLOCK"
        boolean is_active
        timestamp created_at
    }

    trades ||--o{ trade_images : "has"
    trades }o--o| strategies : "uses"
    trades ||--o{ trade_mistakes : "has"
    mistakes ||--o{ trade_mistakes : "linked to"
    rules }o--|| users_ref : "belongs to"
```

**Indexes:**
```sql
-- trades
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_user_opened_at ON trades(user_id, opened_at DESC);
CREATE INDEX idx_trades_user_strategy ON trades(user_id, strategy_id);
CREATE INDEX idx_trades_symbol ON trades(user_id, symbol);

-- trade_images
CREATE INDEX idx_trade_images_trade_id ON trade_images(trade_id);

-- strategies
CREATE INDEX idx_strategies_user_id ON strategies(user_id);

-- trade_mistakes
CREATE INDEX idx_trade_mistakes_trade_id ON trade_mistakes(trade_id);
CREATE INDEX idx_trade_mistakes_mistake_id ON trade_mistakes(mistake_id);
```

---

### 1.3 Analytics Service Database

```mermaid
erDiagram
    daily_stats {
        uuid id PK
        uuid user_id
        date stat_date
        int total_trades
        int winning_trades
        int losing_trades
        decimal total_pnl
        decimal avg_rr
        decimal largest_win
        decimal largest_loss
        timestamp updated_at
    }

    strategy_stats {
        uuid id PK
        uuid user_id
        uuid strategy_id
        int total_trades
        int winning_trades
        decimal total_pnl
        decimal avg_pnl
        timestamp updated_at
    }

    mistake_stats {
        uuid id PK
        uuid user_id
        uuid mistake_id
        varchar mistake_name
        int occurrence_count
        decimal total_loss
        timestamp updated_at
    }

    reports {
        uuid id PK
        uuid user_id
        enum type "WEEKLY | MONTHLY"
        date date_from
        date date_to
        enum status "PENDING | PROCESSING | COMPLETED | FAILED"
        jsonb data
        timestamp created_at
        timestamp completed_at
    }

    daily_stats }o--|| users_ref : "belongs to"
    strategy_stats }o--|| users_ref : "belongs to"
    mistake_stats }o--|| users_ref : "belongs to"
    reports }o--|| users_ref : "belongs to"
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_daily_stats_user_date ON daily_stats(user_id, stat_date);
CREATE INDEX idx_daily_stats_date_range ON daily_stats(user_id, stat_date DESC);
CREATE UNIQUE INDEX idx_strategy_stats_user_strategy ON strategy_stats(user_id, strategy_id);
CREATE INDEX idx_reports_user ON reports(user_id, created_at DESC);
```

---

## 2. Design Patterns — Detailed Implementation

### 2.1 Strategy Pattern — P&L Calculator

```mermaid
classDiagram
    class PnLCalculator {
        <<interface>>
        +calculate(trade: TradeInput): PnLResult
    }

    class EquityCalculator {
        +calculate(trade: TradeInput): PnLResult
    }

    class OptionsCalculator {
        +calculate(trade: TradeInput): PnLResult
    }

    class FuturesCalculator {
        +calculate(trade: TradeInput): PnLResult
    }

    class PnLCalculatorFactory {
        +getCalculator(tradeType: TradeType): PnLCalculator
    }

    PnLCalculator <|.. EquityCalculator
    PnLCalculator <|.. OptionsCalculator
    PnLCalculator <|.. FuturesCalculator
    PnLCalculatorFactory --> PnLCalculator
```

**Logic:**
```
EquityCalculator:
  LONG:  pnl = (exitPrice - entryPrice) * quantity - fees
  SHORT: pnl = (entryPrice - exitPrice) * quantity - fees

OptionsCalculator:
  LONG:  pnl = (exitPremium - entryPremium) * quantity * lotSize - fees
  SHORT: pnl = (entryPremium - exitPremium) * quantity * lotSize - fees

FuturesCalculator:
  LONG:  pnl = (exitPrice - entryPrice) * quantity * contractMultiplier - fees
  SHORT: pnl = (entryPrice - exitPrice) * quantity * contractMultiplier - fees
```

---

### 2.2 State Machine — Trade Lifecycle

```mermaid
stateDiagram-v2
    [*] --> OPEN : Create trade (no exit price)
    [*] --> CLOSED : Create trade (with exit price)
    OPEN --> CLOSED : Close trade (add exit price)
    CLOSED --> REVIEWED : Review trade (add notes/mistakes)
    
    OPEN --> OPEN : Update (edit entry, SL, TP)
    CLOSED --> CLOSED : Update (edit notes, tags)
    REVIEWED --> REVIEWED : Update (edit review notes)
```

**Transition Rules:**
| Current State | Allowed Actions | Blocked Actions |
|---------------|----------------|-----------------|
| OPEN | update, close, delete | review |
| CLOSED | update, review, delete | close (already closed) |
| REVIEWED | update review, delete | close |

**Implementation:**
```
class TradeStateMachine:
  transitions = {
    OPEN:     [CLOSED],
    CLOSED:   [REVIEWED],
    REVIEWED: []
  }

  canTransition(from, to):
    return to in transitions[from]

  transition(trade, targetState):
    if !canTransition(trade.status, targetState):
      throw InvalidStateTransitionError
    return { ...trade, status: targetState }
```

---

### 2.3 Rule Engine — Trade Validation

```mermaid
classDiagram
    class RuleEvaluator {
        +evaluate(trade: Trade, rules: Rule[]): Violation[]
    }

    class Rule {
        +id: string
        +conditionType: ConditionType
        +operator: Operator
        +value: string
        +action: WARN | BLOCK
    }

    class Violation {
        +ruleId: string
        +ruleName: string
        +message: string
        +action: WARN | BLOCK
    }

    class ConditionEvaluator {
        <<interface>>
        +evaluate(trade: Trade, rule: Rule): boolean
    }

    class MaxRiskEvaluator {
        +evaluate(trade: Trade, rule: Rule): boolean
    }

    class MinRREvaluator {
        +evaluate(trade: Trade, rule: Rule): boolean
    }

    class TradingHoursEvaluator {
        +evaluate(trade: Trade, rule: Rule): boolean
    }

    class MaxDailyTradesEvaluator {
        +evaluate(trade: Trade, rule: Rule): boolean
    }

    RuleEvaluator --> Rule
    RuleEvaluator --> Violation
    ConditionEvaluator <|.. MaxRiskEvaluator
    ConditionEvaluator <|.. MinRREvaluator
    ConditionEvaluator <|.. TradingHoursEvaluator
    ConditionEvaluator <|.. MaxDailyTradesEvaluator
    RuleEvaluator --> ConditionEvaluator
```

**Flow:**
```
1. User creates trade
2. Fetch user's active rules
3. For each rule:
   - Get appropriate ConditionEvaluator
   - Evaluate trade against rule
   - If violated → add to violations list
4. If any violation has action=BLOCK → reject trade creation
5. If violations have action=WARN → save trade + auto-link violations as mistakes
6. Return trade + violations to user
```

---

### 2.4 Repository Pattern

```mermaid
classDiagram
    class TradeRepository {
        <<interface>>
        +create(data: CreateTradeDto): Trade
        +findById(id: string): Trade
        +findByUserId(userId: string, filters: TradeFilters): PaginatedResult~Trade~
        +update(id: string, data: UpdateTradeDto): Trade
        +delete(id: string): void
        +countByUserAndDate(userId: string, date: Date): number
    }

    class PrismaTradeRepository {
        -prisma: PrismaClient
        +create(data: CreateTradeDto): Trade
        +findById(id: string): Trade
        +findByUserId(userId: string, filters: TradeFilters): PaginatedResult~Trade~
        +update(id: string, data: UpdateTradeDto): Trade
        +delete(id: string): void
        +countByUserAndDate(userId: string, date: Date): number
    }

    TradeRepository <|.. PrismaTradeRepository

    class TradeService {
        -tradeRepo: TradeRepository
        -pnlCalculator: PnLCalculatorFactory
        -stateMachine: TradeStateMachine
        -ruleEvaluator: RuleEvaluator
        -eventPublisher: EventPublisher
    }

    TradeService --> TradeRepository
```

**Why:** Services depend on the interface, not the implementation. Makes unit testing easy (mock the repository), and you could swap Prisma for TypeORM without touching service logic.

---

## 3. Module Structure (NestJS)

### 3.1 Trade Service — Internal Modules

```
trade-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── trades/
│   │   ├── trades.module.ts
│   │   ├── trades.controller.ts
│   │   ├── trades.service.ts
│   │   ├── trades.repository.ts
│   │   ├── dto/
│   │   │   ├── create-trade.dto.ts
│   │   │   ├── update-trade.dto.ts
│   │   │   └── trade-filters.dto.ts
│   │   ├── entities/
│   │   │   └── trade.entity.ts
│   │   ├── pnl/
│   │   │   ├── pnl-calculator.interface.ts
│   │   │   ├── pnl-calculator.factory.ts
│   │   │   ├── equity.calculator.ts
│   │   │   ├── options.calculator.ts
│   │   │   └── futures.calculator.ts
│   │   ├── state-machine/
│   │   │   └── trade-state-machine.ts
│   │   └── images/
│   │       ├── images.service.ts
│   │       └── images.controller.ts
│   │
│   ├── strategies/
│   │   ├── strategies.module.ts
│   │   ├── strategies.controller.ts
│   │   ├── strategies.service.ts
│   │   └── strategies.repository.ts
│   │
│   ├── mistakes/
│   │   ├── mistakes.module.ts
│   │   ├── mistakes.controller.ts
│   │   ├── mistakes.service.ts
│   │   └── mistakes.repository.ts
│   │
│   ├── rules/
│   │   ├── rules.module.ts
│   │   ├── rules.controller.ts
│   │   ├── rules.service.ts
│   │   ├── rule-evaluator.ts
│   │   └── evaluators/
│   │       ├── condition-evaluator.interface.ts
│   │       ├── max-risk.evaluator.ts
│   │       ├── min-rr.evaluator.ts
│   │       ├── trading-hours.evaluator.ts
│   │       └── max-daily-trades.evaluator.ts
│   │
│   ├── events/
│   │   └── event-publisher.service.ts
│   │
│   └── shared/
│       ├── filters/
│       │   └── http-exception.filter.ts
│       ├── interceptors/
│       │   └── logging.interceptor.ts
│       └── pipes/
│           └── validation.pipe.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/
│   ├── trades.service.spec.ts
│   ├── pnl-calculator.spec.ts
│   ├── trade-state-machine.spec.ts
│   └── rule-evaluator.spec.ts
│
├── Dockerfile
├── package.json
└── tsconfig.json
```

### 3.2 Auth Service — Internal Modules

```
auth-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── signup.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── guards/
│   │       └── jwt.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.repository.ts
│   ├── tokens/
│   │   ├── tokens.module.ts
│   │   └── tokens.service.ts
│   └── shared/
│       └── ...
├── prisma/
├── Dockerfile
└── package.json
```

### 3.3 Analytics Service — Internal Modules

```
analytics-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── stats-aggregator.service.ts
│   │   └── analytics.repository.ts
│   ├── reports/
│   │   ├── reports.module.ts
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   └── report-generator.processor.ts  (BullMQ worker)
│   ├── events/
│   │   ├── events.module.ts
│   │   └── event-consumer.service.ts
│   ├── cache/
│   │   ├── cache.module.ts
│   │   └── cache.service.ts
│   └── shared/
│       └── ...
├── prisma/
├── Dockerfile
└── package.json
```

### 3.4 API Gateway

```
api-gateway/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── proxy/
│   │   └── proxy.module.ts         (routes to services)
│   ├── guards/
│   │   └── auth.guard.ts           (validates JWT, attaches userId)
│   ├── interceptors/
│   │   ├── rate-limiter.interceptor.ts
│   │   └── correlation-id.interceptor.ts
│   └── filters/
│       └── global-exception.filter.ts
├── Dockerfile
└── package.json
```

### 3.5 Angular Frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   │
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts      (attach JWT)
│   │   │   │   └── error.interceptor.ts     (global error handling)
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── storage.service.ts
│   │   │   └── models/
│   │   │       ├── trade.model.ts
│   │   │       ├── strategy.model.ts
│   │   │       └── user.model.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.component.ts
│   │   │   ├── trades/
│   │   │   │   ├── trade-list/
│   │   │   │   ├── trade-form/
│   │   │   │   ├── trade-detail/
│   │   │   │   └── trade-import/
│   │   │   ├── strategies/
│   │   │   │   ├── strategy-list/
│   │   │   │   └── strategy-form/
│   │   │   ├── mistakes/
│   │   │   │   ├── mistake-list/
│   │   │   │   └── mistake-form/
│   │   │   ├── analytics/
│   │   │   │   ├── performance-chart/
│   │   │   │   ├── strategy-breakdown/
│   │   │   │   └── patterns/
│   │   │   ├── reports/
│   │   │   │   └── report-list/
│   │   │   └── rules/
│   │   │       ├── rule-list/
│   │   │       └── rule-form/
│   │   │
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── navbar/
│   │       │   ├── sidebar/
│   │       │   ├── pagination/
│   │       │   ├── file-upload/
│   │       │   └── confirmation-dialog/
│   │       └── pipes/
│   │           ├── currency.pipe.ts
│   │           └── pnl-color.pipe.ts
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── styles/
│       └── global.scss
│
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 4. Key Class Diagrams

### 4.1 Trade Service — Core Classes

```mermaid
classDiagram
    class TradesController {
        -tradesService: TradesService
        +create(dto: CreateTradeDto, files: File[]): Trade
        +findAll(userId: string, filters: TradeFiltersDto): PaginatedResult
        +findOne(id: string): Trade
        +update(id: string, dto: UpdateTradeDto): Trade
        +close(id: string, dto: CloseTradeDto): Trade
        +review(id: string, dto: ReviewTradeDto): Trade
        +delete(id: string): void
        +importCsv(file: File): ImportResult
        +uploadScreenshots(tradeId: string, files: File[]): ImageUrl[]
    }

    class TradesService {
        -tradeRepo: TradeRepository
        -pnlFactory: PnLCalculatorFactory
        -stateMachine: TradeStateMachine
        -ruleEvaluator: RuleEvaluator
        -imageService: ImageService
        -eventPublisher: EventPublisher
        +createTrade(userId: string, dto: CreateTradeDto, files: File[]): TradeWithViolations
        +closeTrade(id: string, dto: CloseTradeDto): Trade
        +reviewTrade(id: string, dto: ReviewTradeDto): Trade
        +importFromCsv(userId: string, file: File): ImportResult
    }

    class ImageService {
        -storageProvider: StorageProvider
        +upload(tradeId: string, files: File[]): string[]
        +delete(imageId: string): void
        +validateFile(file: File): boolean
    }

    class StorageProvider {
        <<interface>>
        +save(path: string, buffer: Buffer): string
        +delete(path: string): void
        +getUrl(path: string): string
    }

    class LocalStorageProvider {
        +save(path: string, buffer: Buffer): string
        +delete(path: string): void
        +getUrl(path: string): string
    }

    class S3StorageProvider {
        +save(path: string, buffer: Buffer): string
        +delete(path: string): void
        +getUrl(path: string): string
    }

    TradesController --> TradesService
    TradesService --> ImageService
    ImageService --> StorageProvider
    StorageProvider <|.. LocalStorageProvider
    StorageProvider <|.. S3StorageProvider
```

### 4.2 Analytics Service — Core Classes

```mermaid
classDiagram
    class EventConsumer {
        -statsAggregator: StatsAggregator
        -cacheService: CacheService
        +handleTradeCreated(payload): void
        +handleTradeUpdated(payload): void
        +handleTradeClosed(payload): void
        +handleTradeDeleted(payload): void
        +handleBulkImported(payload): void
    }

    class StatsAggregator {
        -analyticsRepo: AnalyticsRepository
        -cacheService: CacheService
        +recalculateDailyStats(userId: string, date: Date): void
        +recalculateStrategyStats(userId: string, strategyId: string): void
        +getDashboard(userId: string): DashboardData
        +getPerformance(userId: string, period: string, range: DateRange): DataPoint[]
    }

    class CacheService {
        -redis: Redis
        +get(key: string): any
        +set(key: string, data: any, ttl: number): void
        +invalidate(pattern: string): void
    }

    class ReportGeneratorProcessor {
        -analyticsRepo: AnalyticsRepository
        +process(job: Job~ReportJobData~): void
        -generateWeeklyReport(userId: string, range: DateRange): ReportData
        -generateMonthlyReport(userId: string, range: DateRange): ReportData
    }

    EventConsumer --> StatsAggregator
    StatsAggregator --> CacheService
    EventConsumer --> CacheService
```

---

## 5. File Upload Flow (Detailed)

```
1. Angular:
   - User selects files in trade form (file-upload component)
   - Validate client-side: type (PNG/JPG/JPEG/WebP), size (<5MB), count (≤5)
   - Send as multipart/form-data with trade data

2. API Gateway:
   - Forward multipart request to Trade Service (no parsing at gateway)

3. Trade Service:
   - Multer middleware parses multipart request
   - ImageService.validateFile() — recheck type, size, dimensions
   - Generate unique filename: {userId}/{tradeId}/{uuid}.{ext}
   - StorageProvider.save() — write to local disk or S3
   - Store file metadata in trade_images table
   - Return image URLs with trade response

4. Serving images:
   - Dev: NestJS serves static files from /uploads directory
   - Prod: S3 pre-signed URLs or CDN
```

---

## 6. Error Handling Strategy

**Standardized Error Response:**
```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Entry price must be greater than 0",
  "timestamp": "2026-06-14T10:30:00Z",
  "correlationId": "abc-123-def"
}
```

**Error Types:**
| Code | HTTP Status | When |
|------|-------------|------|
| VALIDATION_ERROR | 400 | DTO validation fails |
| INVALID_STATE_TRANSITION | 400 | e.g., trying to review an OPEN trade |
| RULE_VIOLATION_BLOCKED | 400 | Trade violates a BLOCK rule |
| UNAUTHORIZED | 401 | Missing/invalid JWT |
| FORBIDDEN | 403 | Accessing another user's resource |
| NOT_FOUND | 404 | Trade/Strategy/Mistake not found |
| FILE_TOO_LARGE | 413 | Image > 5MB |
| UNSUPPORTED_FILE_TYPE | 415 | Not PNG/JPG/JPEG/WebP |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unhandled exception |

---

## 7. Authentication — Token Flow Detail

```
Access Token (JWT):
  - Payload: { userId, email, iat, exp }
  - Expiry: 15 minutes
  - Stored: Memory (Angular service) — NOT localStorage
  - Signed with: RS256 or HS256 secret

Refresh Token:
  - Opaque random string (crypto.randomUUID)
  - Expiry: 7 days
  - Stored: Redis (server) + httpOnly cookie (client)
  - Rotation: New refresh token issued on each refresh call, old one invalidated

Token Refresh Logic (Angular Interceptor):
  1. Request fails with 401
  2. Interceptor catches → calls /auth/refresh
  3. If refresh succeeds → retry original request with new token
  4. If refresh fails → redirect to login
  5. Queue concurrent requests while refresh is in-flight (avoid multiple refresh calls)
```

---

## 8. Pagination Strategy

**Trade History — Cursor-based:**
```
GET /trades?limit=20&cursor=2026-06-10T14:30:00Z

Response:
{
  "trades": [...],
  "nextCursor": "2026-06-09T18:00:00Z",  // opened_at of last item
  "hasMore": true
}
```
Why cursor-based: Trade list is time-ordered, avoids offset skipping issues with new inserts.

**Reports — Page-based:**
```
GET /reports?page=1&limit=10

Response:
{
  "reports": [...],
  "total": 24,
  "page": 1,
  "totalPages": 3
}
```
Why page-based: Reports don't change frequently, simpler UX for numbered pages.
