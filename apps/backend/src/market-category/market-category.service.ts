import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  TCreateMarketCategoryChildSchema,
  TCreateMarketCategorySchema,
} from './market-category.controller';
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

  async createMarketCategoryChild(body: TCreateMarketCategoryChildSchema) {
    try {
      const newMarketCategory = await this.prismaService.marketCategory.create({
        data: {
          parentId: body.parentId,
          name: body.name,
          information: body.information ?? {},
        },
      });
      return { success: true, id: newMarketCategory.id };
    } catch (e: any) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'Market category with this name already exists',
          );
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Parent market category does not exist',
          );
        }
      }
      throw e;
    }
  }

  async getMarketCategories() {
    const marketCategories = await this.prismaService.marketCategory.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: true,
      },
    });
    return {
      success: true,
      marketCategories,
    };
  }

  async getMarketCategoryById(id: number) {
    const marketCategory = await this.prismaService.marketCategory.findFirst({
      where: { id },
      include: {
        markets: {
          where: { isActive: true },
        },
        children: {
          include: {
            markets: {
              where: { isActive: true },
            },
          },
        },
      },
    });
    if (!marketCategory) {
      throw new BadRequestException('Market category does not exist');
    }
    return {
      success: true,
      marketCategory,
    };
  }

  async getMarketCategoryMarketsById(id: number) {
    const marketCategory = await this.prismaService.marketCategory.findFirst({
      where: { id },
      include: {
        markets: {
          where: { isActive: true },
          include: {
            outcomes: {
              select: {
                id: true,
                name: true,
                ticker: true,
              },
            },
          },
        },
        children: {
          include: {
            markets: {
              where: { isActive: true },
              include: {
                outcomes: {
                  select: {
                    id: true,
                    name: true,
                    ticker: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!marketCategory) {
      throw new BadRequestException('Market category does not exist');
    }
    const parentMarkets = marketCategory.markets;
    const childrenMarkets = marketCategory.children.flatMap(
      (child) => child.markets,
    );
    return {
      success: true,
      markets: [...parentMarkets, ...childrenMarkets],
    };
  }
}
