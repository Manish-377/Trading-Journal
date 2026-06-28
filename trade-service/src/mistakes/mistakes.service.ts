import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMistakeDto } from './dto/create-mistake.dto';
import { UpdateMistakeDto } from './dto/update-mistake.dto';
import { QueryMistakeDto } from './dto/query-mistake.dto';

@Injectable()
export class MistakesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMistakeDto) {
    return this.prisma.mistake.create({
      data: {
        userId,
        category: dto.category,
        description: dto.description,
        lesson: dto.lesson,
        severity: dto.severity || 'MEDIUM',
        tradeId: dto.tradeId,
        strategyId: dto.strategyId,
      },
      include: { trade: { select: { id: true, symbol: true } }, strategy: { select: { id: true, name: true } } },
    });
  }

  async findAll(userId: string, query: QueryMistakeDto) {
    const where: any = { userId };
    if (query.category) where.category = query.category;
    if (query.severity) where.severity = query.severity;
    if (query.tradeId) where.tradeId = query.tradeId;
    if (query.strategyId) where.strategyId = query.strategyId;

    return this.prisma.mistake.findMany({
      where,
      include: { trade: { select: { id: true, symbol: true } }, strategy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const mistake = await this.prisma.mistake.findFirst({
      where: { id, userId },
      include: { trade: { select: { id: true, symbol: true } }, strategy: { select: { id: true, name: true } } },
    });
    if (!mistake) throw new NotFoundException('Mistake not found');
    return mistake;
  }

  async update(userId: string, id: string, dto: UpdateMistakeDto) {
    await this.findOne(userId, id);
    return this.prisma.mistake.update({
      where: { id },
      data: dto,
      include: { trade: { select: { id: true, symbol: true } }, strategy: { select: { id: true, name: true } } },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.mistake.delete({ where: { id } });
    return { message: 'Mistake deleted' };
  }

  async getStats(userId: string) {
    const [byCategory, bySeverity, total] = await Promise.all([
      this.prisma.mistake.groupBy({
        by: ['category'],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.mistake.groupBy({
        by: ['severity'],
        where: { userId },
        _count: { id: true },
      }),
      this.prisma.mistake.count({ where: { userId } }),
    ]);

    return { total, byCategory, bySeverity };
  }
}
