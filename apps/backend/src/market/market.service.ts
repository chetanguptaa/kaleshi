import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateMarketSchema } from './market.controller';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

@Injectable()
export class MarketService {
  constructor(private readonly prismaService: PrismaService) {}

  async createMarket(body: TCreateMarketSchema) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const newMarket = await tx.market.create({
          data: {
            name: body.name,
            marketCategoryId: body.marketCategoryId,
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            ticker: body.ticker,
            information: body.information ?? {},
            ruleBook: body.ruleBook ?? null,
            rules: body.rules ?? null,
          },
        });
        await tx.outcome.createMany({
          data: body.outcomes.map((o) => ({
            name: o,
            marketId: newMarket.id,
          })),
        });
        return newMarket;
      });
      return { success: true, id: result.id };
    } catch (e: any) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Market category for this market does not exist',
          );
        }
      }
      throw e;
    }
  }

  async activateMarket(id: number) {
    const market = await this.prismaService.market.findFirst({
      where: {
        id,
      },
    });
    if (!market) {
      throw new BadRequestException('Market does not exist');
    }
    if (market.isActive) {
      throw new BadRequestException('Market is already active');
    }
    if (market.endsAt < new Date()) {
      throw new BadRequestException('Market has already ended');
    }
    await this.prismaService.market.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });
    return {
      success: true,
    };
  }

  async getMarketById(id: number) {
    const market = await this.prismaService.market.findFirst({
      where: {
        id,
      },
    });
    if (!market || !market.isActive) {
      throw new BadRequestException('Market does not exist');
    }
    return {
      success: true,
      market,
    };
  }

  async getMarkets(type?: 'inactive') {
    const query: {
      isActive?: boolean;
    } = {};
    if (type && type === 'inactive') {
      query.isActive = false;
    }
    const markets = await this.prismaService.market.findMany({
      where: query,
    });
    return {
      success: true,
      markets,
    };
  }

  async getActiveMarkets() {
    const markets = await this.prismaService.market.findMany({
      where: {
        isActive: true,
      },
    });
    return {
      success: true,
      markets,
    };
  }
}
