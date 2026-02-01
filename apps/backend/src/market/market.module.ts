import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { CommentModule } from './comment/comment.module';
import { TimeseriesService } from 'src/timeseries/timeseries.service';
import { RedisPublisherService } from 'src/redis/redis.publisher.service';

@Module({
  imports: [CommentModule],
  providers: [
    MarketService,
    PrismaService,
    AuthService,
    TimeseriesService,
    RedisPublisherService,
  ],
  controllers: [MarketController],
})
export class MarketModule {}
