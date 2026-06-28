# Trading Journal — Project Plan

## Overview

A trading journal application that helps traders log, analyze, and improve their trading performance. Designed with microservice architecture demonstrating SDE-2 level system design concepts.

---

## Architecture — 3 Microservices

```
         ┌──────────────────┐
         │    Angular App    │
         │  (Lazy-loaded     │
         │   modules)        │
         └────────┬─────────┘
                  ↓ HTTP
         ┌──────────────────┐
         │   API Gateway     │
         │  - Routing        │
         │  - Rate Limiting  │
         │  - Auth Validation│
         └──┬──────┬──────┬─┘
            ↓      ↓      ↓
     ┌──────────┐ ┌──────────┐ ┌────────────────┐
     │   Auth   │ │  Trade   │ │   Analytics    │
     │ Service  │ │ Service  │ │    Service     │
     └────┬─────┘ └────┬─────┘ └───────┬────────┘
          ↓            ↓               ↓
     [User DB]    [Trade DB]     [Analytics DB + Redis]
                       │
                       │  events (Redis Pub/Sub)
                       └────────────────→  Analytics consumes
```

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | Angular 17+ (standalone, signals)   |
| State Management | NgRx / RxJS services                |
| Charts           | ng2-charts or ECharts               |
| API Gateway      | NestJS (thin routing + guards)      |
| Auth Service     | NestJS + JWT + Refresh Tokens       |
| Trade Service    | NestJS                              |
| Analytics Service| NestJS                              |
| Database         | PostgreSQL (per-service schema)     |
| Cache & Queue    | Redis (caching + pub/sub + BullMQ)  |
| ORM              | Prisma                              |
| File Storage     | Local disk (dev) / S3-compatible (prod) |
| Containerization | Docker + Docker Compose             |

---

## Features — Current Scope

### 1. Authentication (Auth Service)
- Sign up / Login
- JWT access token + refresh token rotation
- Password hashing (bcrypt)
- Token blacklisting on logout

### 2. Trade Management (Trade Service)
- Add trade manually (form)
- Import trades via CSV upload
- Upload trade screenshots (PNG, JPG, JPEG, WebP — max 5MB per image, up to 5 per trade)
- Edit / Delete trades
- Trade lifecycle state machine: `OPEN → CLOSED → REVIEWED`
- P&L calculation (Strategy Pattern — different calc for equity/options/futures)
- Tag trades with strategy and mistakes

### 3. Strategy Management (Trade Service)
- CRUD strategies
- Link strategies to trades
- Track win rate per strategy (computed)

### 4. Mistake Management (Trade Service)
- CRUD mistake categories
- Auto-flag rule violations (user-defined rules like "max 2% risk per trade")
- Link mistakes to specific trades

### 5. Dashboard (Analytics Service)
- Overall P&L (daily, weekly, monthly)
- Win rate, average RR, streak
- Recent trades summary
- Stats served from Redis cache, invalidated on trade events

### 6. Analytics (Analytics Service)
- Performance over time (line chart)
- Win rate by strategy (bar chart)
- Most common mistakes (pie chart)
- Risk-reward distribution
- Day-of-week / time-of-day performance

### 7. Reports (Analytics Service)
- Weekly / Monthly summary report
- Generated via background job (BullMQ)
- Downloadable (PDF or in-app view)

---

## System Design Concepts Used

### HLD (Architecture)

| Concept | Applied Where |
|---------|---------------|
| Microservices (3 services) | Auth, Trade, Analytics — split by scaling needs and data ownership |
| Event-Driven (async) | Trade events → Analytics recalculates stats in background |
| Caching | Dashboard stats cached in Redis, invalidated on trade write events |
| Background Jobs | Report generation via BullMQ — doesn't block API response |
| API Gateway | Single entry point, centralizes auth check and rate limiting |

### LLD (Code Design)

| Concept | Applied Where |
|---------|---------------|
| Strategy Pattern | P&L calculation differs by trade type (equity vs options vs futures) |
| State Machine | Trade lifecycle — prevents invalid transitions (can't review an open trade) |
| Repository Pattern | Data access abstracted — services don't call DB directly |
| Rule Validation | User-defined trading rules checked against new trades, violations auto-flagged |

---

## Inter-Service Communication

| From | To | Method | Events |
|------|----|--------|--------|
| Gateway | All services | HTTP (sync) | — |
| Trade Service | Analytics Service | Redis Pub/Sub (async) | `trade.created`, `trade.updated`, `trade.deleted`, `trade.closed` |
| Analytics Service | (self) | BullMQ (async) | `report.generate` |

---

## Data Ownership

| Service | Owns |
|---------|------|
| Auth Service | users, refresh_tokens |
| Trade Service | trades, strategies, mistakes, rules |
| Analytics Service | aggregated_stats, reports, cached metrics |

No shared database. Services own their schema independently.

---

## Future Enhancements (NOT in current scope)

| Enhancement | Description |
|-------------|-------------|
| **Broker API Integration** | Connect to broker APIs (Zerodha Kite, Alpaca, Interactive Brokers) to auto-fetch trades instead of manual entry |
| **Real-time Market Data** | WebSocket stream for live P&L when trade is open |
| **Social/Community** | Share strategies/performance with other users |
| **AI Insights** | Pattern detection — "you lose more on Mondays" or "you break rules after a winning streak" |
| **Mobile App** | Quick trade logging on the go |
| **Notifications** | Alert when rule is violated, daily recap push |
| **Multi-Broker Support** | Unified view across different brokerage accounts |
| **Backtesting** | Test strategies against historical data |

---

## Local Development Setup (planned)

```
docker-compose up   → spins up PostgreSQL, Redis, all 3 services
ng serve            → Angular dev server with proxy to gateway
```

---

## Next Steps

1. ✅ Finalize project plan (this document)
2. Design HLD diagram with detailed API contracts
3. Design database schema (LLD)
4. Scaffold project structure
5. Implement Auth Service
6. Implement Trade Service
7. Implement Analytics Service
8. Build Angular frontend module by module
9. Docker Compose setup
10. Testing & polish
