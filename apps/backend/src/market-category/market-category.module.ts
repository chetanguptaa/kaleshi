import { Module } from '@nestjs/common';
import { MarketCategoryService } from './market-category.service';
import { MarketCategoryController } from './market-category.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  providers: [MarketCategoryService, PrismaService, AuthService],
  controllers: [MarketCategoryController],
})
export class MarketCategoryModule {}
