import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateMarketCategorySchema } from './market-category.controller';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

@Injectable()
export class MarketCategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async createMarketCategory(body: TCreateMarketCategorySchema) {
    try {
      const newMarketCategory = await this.prismaService.marketCategory.create({
        data: {
          name: body.name,
          information: body.information ?? {},
        },
      });
      return { success: true, id: newMarketCategory.id };
    } catch (e: any) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException(
          'Market category with this name already exists',
        );
      }
      throw e;
    }
  }
}
