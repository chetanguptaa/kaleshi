import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateMarketCategorySchema } from './market-category.controller';

@Injectable()
export class MarketCategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async createMarketCategory(
    userId: number,
    body: TCreateMarketCategorySchema,
  ) {
    return this.prismaService.marketCategory.create({
      data: {
        createdByUserId: userId,
        name: body.name,
        information: body.information ?? {},
      },
    });
  }
}
