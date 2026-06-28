import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  generateRefreshToken(): string {
    return randomUUID();
  }

  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiryDays = this.configService.get('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    const ttlSeconds = expiryDays * 24 * 60 * 60;
    await this.redisService.set(
      `refresh_token:${userId}:${refreshToken}`,
      JSON.stringify({ userId, createdAt: new Date().toISOString() }),
      ttlSeconds,
    );
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const stored = await this.redisService.get(`refresh_token:${userId}:${refreshToken}`);
    return stored !== null;
  }

  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.redisService.del(`refresh_token:${userId}:${refreshToken}`);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.redisService.delByPattern(`refresh_token:${userId}:*`);
  }
}
