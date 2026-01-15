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
}
