import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { StrategiesModule } from './strategies/strategies.module';
import { MistakesModule } from './mistakes/mistakes.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TradesModule,
    StrategiesModule,
    MistakesModule,
    EventsModule,
  ],
})
export class AppModule {}
