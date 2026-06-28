-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('EQUITY', 'OPTIONS', 'FUTURES');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED', 'REVIEWED');

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "trade_type" "TradeType" NOT NULL,
    "direction" "Direction" NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "entry_price" DECIMAL(12,4) NOT NULL,
    "exit_price" DECIMAL(12,4),
    "quantity" DECIMAL(12,4) NOT NULL,
    "stop_loss" DECIMAL(12,4),
    "take_profit" DECIMAL(12,4),
    "pnl" DECIMAL(12,4),
    "fees" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "risk_reward_ratio" DECIMAL(6,2),
    "strategy_id" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "opened_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_images" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trades_user_id_idx" ON "trades"("user_id");

-- CreateIndex
CREATE INDEX "trades_user_id_status_idx" ON "trades"("user_id", "status");

-- CreateIndex
CREATE INDEX "trades_user_id_opened_at_idx" ON "trades"("user_id", "opened_at" DESC);

-- CreateIndex
CREATE INDEX "trades_user_id_symbol_idx" ON "trades"("user_id", "symbol");

-- CreateIndex
CREATE INDEX "trade_images_trade_id_idx" ON "trade_images"("trade_id");

-- AddForeignKey
ALTER TABLE "trade_images" ADD CONSTRAINT "trade_images_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
