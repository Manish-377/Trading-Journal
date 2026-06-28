import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Injectable()
export class StrategiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateStrategyDto) {
    try {
      return await this.prisma.strategy.create({
        data: {
          userId,
          name: dto.name,
          description: dto.description,
          rules: dto.rules || [],
          tags: dto.tags || [],
          isActive: dto.isActive ?? true,
        },
        include: { _count: { select: { trades: true, mistakes: true } } },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Strategy "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(userId: string, activeOnly?: boolean) {
    const where: any = { userId };
    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }
    return this.prisma.strategy.findMany({
      where,
      include: { _count: { select: { trades: true, mistakes: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id, userId },
      include: { _count: { select: { trades: true, mistakes: true } } },
    });
    if (!strategy) throw new NotFoundException('Strategy not found');
    return strategy;
  }

  async update(userId: string, id: string, dto: UpdateStrategyDto) {
    await this.findOne(userId, id);
    try {
      return await this.prisma.strategy.update({
        where: { id },
        data: dto,
        include: { _count: { select: { trades: true, mistakes: true } } },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Strategy "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.strategy.delete({ where: { id } });
    return { message: 'Strategy deleted' };
  }
}
