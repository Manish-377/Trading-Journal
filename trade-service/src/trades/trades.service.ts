import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { QueryTradeDto } from './dto/query-trade.dto';
import { TradeStateMachine } from './trade-state-machine';
import { PnLCalculatorFactory } from './pnl-calculator';
import { TradeStatus } from '../common/enums/trade.enum';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class TradesService {
  constructor(
    private prisma: PrismaService,
    private eventPublisher: EventPublisherService,
  ) {}

  async create(userId: string, dto: CreateTradeDto) {
    const status = dto.exitPrice ? TradeStatus.CLOSED : TradeStatus.OPEN;

    let pnl = null;
    let riskRewardRatio = null;

    if (dto.exitPrice) {
      const result = PnLCalculatorFactory.calculate({
        tradeType: dto.tradeType,
        direction: dto.direction,
        entryPrice: dto.entryPrice,
        exitPrice: dto.exitPrice,
        quantity: dto.quantity,
        fees: dto.fees || 0,
      });
      pnl = result.pnl;
      riskRewardRatio = result.riskRewardRatio;
    }

    // Calculate risk/reward if stop loss and take profit provided
    if (dto.stopLoss && dto.takeProfit) {
      const risk = Math.abs(dto.entryPrice - dto.stopLoss);
      const reward = Math.abs(dto.takeProfit - dto.entryPrice);
      riskRewardRatio = risk > 0 ? Math.round((reward / risk) * 100) / 100 : null;
    }

    return this.prisma.trade.create({
      data: {
        userId,
        symbol: dto.symbol.toUpperCase(),
        tradeType: dto.tradeType,
        direction: dto.direction,
        status,
        entryPrice: dto.entryPrice,
        exitPrice: dto.exitPrice,
        quantity: dto.quantity,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit,
        pnl,
        fees: dto.fees || 0,
        riskRewardRatio,
        strategyId: dto.strategyId,
        notes: dto.notes,
        tags: dto.tags || [],
        openedAt: new Date(dto.openedAt),
        closedAt: dto.closedAt ? new Date(dto.closedAt) : null,
      },
      include: { images: true },
    }).then(async (trade) => {
      await this.eventPublisher.publishTradeCreated(userId, trade);
      if (trade.status === TradeStatus.CLOSED) {
        await this.eventPublisher.publishTradeClosed(userId, trade);
      }
      return trade;
    });
  }

  async bulkImport(userId: string, trades: CreateTradeDto[]) {
    const results = { imported: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < trades.length; i++) {
      try {
        await this.create(userId, trades[i]);
        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${err.message || 'Unknown error'}`);
      }
    }

    return results;
  }

  async findAll(userId: string, query: QueryTradeDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.status) where.status = query.status;
    if (query.tradeType) where.tradeType = query.tradeType;
    if (query.symbol) where.symbol = query.symbol.toUpperCase();
    if (query.strategyId) where.strategyId = query.strategyId;
    if (query.from || query.to) {
      where.openedAt = {};
      if (query.from) where.openedAt.gte = new Date(query.from);
      if (query.to) where.openedAt.lte = new Date(query.to);
    }

    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        include: { images: true },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      data: trades,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!trade) throw new NotFoundException('Trade not found');
    if (trade.userId !== userId) throw new ForbiddenException();

    return trade;
  }

  async update(userId: string, id: string, dto: UpdateTradeDto) {
    const trade = await this.findOne(userId, id);

    let pnl = trade.pnl;
    let riskRewardRatio = trade.riskRewardRatio;

    const exitPrice = dto.exitPrice ?? (trade.exitPrice ? Number(trade.exitPrice) : undefined);
    const entryPrice = dto.entryPrice ?? Number(trade.entryPrice);

    if (exitPrice) {
      const result = PnLCalculatorFactory.calculate({
        tradeType: trade.tradeType as any,
        direction: trade.direction as any,
        entryPrice,
        exitPrice,
        quantity: dto.quantity ?? Number(trade.quantity),
        fees: dto.fees ?? Number(trade.fees),
      });
      pnl = result.pnl as any;
    }

    const stopLoss = dto.stopLoss ?? (trade.stopLoss ? Number(trade.stopLoss) : undefined);
    const takeProfit = dto.takeProfit ?? (trade.takeProfit ? Number(trade.takeProfit) : undefined);

    if (stopLoss && takeProfit) {
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(takeProfit - entryPrice);
      riskRewardRatio = risk > 0 ? (Math.round((reward / risk) * 100) / 100) as any : null;
    }

    return this.prisma.trade.update({
      where: { id },
      data: {
        ...dto,
        pnl,
        riskRewardRatio,
        openedAt: undefined,
      },
      include: { images: true },
    });
  }

  async close(userId: string, id: string, exitPrice: number, closedAt?: string) {
    const trade = await this.findOne(userId, id);
    TradeStateMachine.transition(trade.status as TradeStatus, TradeStatus.CLOSED);

    const result = PnLCalculatorFactory.calculate({
      tradeType: trade.tradeType as any,
      direction: trade.direction as any,
      entryPrice: Number(trade.entryPrice),
      exitPrice,
      quantity: Number(trade.quantity),
      fees: Number(trade.fees),
    });

    return this.prisma.trade.update({
      where: { id },
      data: {
        status: TradeStatus.CLOSED,
        exitPrice,
        pnl: result.pnl,
        closedAt: closedAt ? new Date(closedAt) : new Date(),
      },
      include: { images: true },
    }).then(async (trade) => {
      await this.eventPublisher.publishTradeClosed(userId, trade);
      return trade;
    });
  }

  async review(userId: string, id: string, notes?: string) {
    const trade = await this.findOne(userId, id);
    TradeStateMachine.transition(trade.status as TradeStatus, TradeStatus.REVIEWED);

    return this.prisma.trade.update({
      where: { id },
      data: {
        status: TradeStatus.REVIEWED,
        notes: notes ?? trade.notes,
        reviewedAt: new Date(),
      },
      include: { images: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.trade.delete({ where: { id } });
    return { message: 'Trade deleted' };
  }

  async addImage(userId: string, tradeId: string, file: Express.Multer.File) {
    await this.findOne(userId, tradeId);

    return this.prisma.tradeImage.create({
      data: {
        tradeId,
        filePath: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });
  }

  async removeImage(userId: string, tradeId: string, imageId: string) {
    await this.findOne(userId, tradeId);

    const image = await this.prisma.tradeImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.tradeId !== tradeId) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.tradeImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted' };
  }
}
