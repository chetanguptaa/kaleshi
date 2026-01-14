import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateMarketCategorySchema } from './market-category.controller';

@Injectable()
export class MarketCategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async createMarketCategory(
    userId: number,
    body: TCreateMarketCategorySchema,
  ) {
    const marketCategory = await this.prismaService.marketCategory.findFirst({
      where: {
        name: body.name,
      },
    });
    if (marketCategory) {
      throw new BadRequestException(
        'Market category with this name, already exists',
      );
    }
    return this.prismaService.marketCategory.create({
      data: {
        createdByUserId: userId,
        name: body.name,
        information: body.information ?? {},
      },
    });
  }
}
