import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [CommentModule],
  providers: [MarketService, PrismaService, AuthService],
  controllers: [MarketController],
})
export class MarketModule {}
