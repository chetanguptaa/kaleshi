import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateMarketSchema } from './market.controller';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { PLATFORM_ACCOUNT_ID, ROLES } from 'src/constants';
import { TimeseriesService } from 'src/timeseries/timeseries.service';
import { QueryResultRow } from 'pg';
import { MarketStatus, OrderSide, TimeInForce } from 'generated/prisma/enums';
import { OrderNewEvent } from 'src/redis/redis-publisher.event-types';
import { RedisPublisherService } from 'src/redis/redis.publisher.service';

@Injectable()
export class MarketService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly timeseriesService: TimeseriesService,
    private readonly redisPublisherService: RedisPublisherService,
  ) {}

  async createMarket(body: TCreateMarketSchema) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const newMarket = await tx.market.create({
          data: {
            name: body.name,
            avatar: body.avatar ?? null,
            marketCategoryId: body.marketCategoryId,
            bettingStartAt: body.bettingStartAt,
            bettingEndAt: body.bettingEndAt,
            eventStartAt: body.eventStartAt,
            eventEndAt: body.eventEndAt,
            metadata: body.metadata ?? {},
            ruleBook: body.ruleBook ?? null,
            rules: body.rules ?? null,
          },
        });
        const createdOutcomes = await Promise.all(
          body.outcomes.map((o) =>
            tx.outcome.create({
              data: {
                name: o.name,
                color: o.color,
                marketId: newMarket.id,
              },
            }),
          ),
        );
        await tx.comment.create({
          data: {
            comment: 'Welcome to the market!',
            accountId: PLATFORM_ACCOUNT_ID,
            marketId: newMarket.id,
          },
        });
        if (body.seedLiquidity !== false) {
          await this.seedData(createdOutcomes, newMarket.id);
        }
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
    if (market.status !== 'DEACTIVATED') {
      throw new BadRequestException(
        `Market cannot be activated from status ${market.status}`,
      );
    }
    if (market.eventEndAt < new Date()) {
      throw new BadRequestException('Market has already ended');
    }
    await this.prismaService.market.update({
      where: {
        id,
      },
      data: {
        status: MarketStatus.DRAFT,
      },
    });
    return {
      success: true,
    };
  }

  async getMarketById(userRoles: string[], id: number) {
    const market = await this.prismaService.market.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        comments: {
          select: {
            id: true,
            comment: true,
            account: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            marketId: true,
            createdAt: true,
            votes: {
              select: {
                id: true,
                vote: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
        outcomes: {
          select: {
            id: true,
            name: true,
          },
        },
        name: true,
        status: true,
        eventStartAt: true,
        eventEndAt: true,
        bettingStartAt: true,
        bettingEndAt: true,
      },
    });
    if (
      !market ||
      (!userRoles.includes(ROLES.ADMIN) &&
        market.status === MarketStatus.DEACTIVATED)
    ) {
      throw new BadRequestException('Market does not exist');
    }
    return {
      success: true,
      market,
    };
  }

  async getMarkets(type?: MarketStatus) {
    const query: {
      status?: MarketStatus;
    } = {};
    if (type) query.status = type;
    const markets = await this.prismaService.market.findMany({
      where: query,
    });
    return {
      success: true,
      markets,
    };
  }

  async getMarketData(id: number) {
    const market = await this.prismaService.market.findUnique({
      where: {
        id,
      },
      include: {
        outcomes: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
    if (!market) {
      throw new BadRequestException('Market does not exist');
    }
    const outcomes = market.outcomes.map((outcome) => ({
      id: outcome.id,
      name: outcome.name,
      color: outcome.color,
    }));
    const data = await this.getLatestData(outcomes);
    return {
      success: true,
      marketId: market.id,
      data,
    };
  }

  async getMarketDataHistory(id: number, from?: Date, to?: Date) {
    const market = await this.prismaService.market.findUnique({
      where: { id },
      include: {
        outcomes: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!market) {
      throw new BadRequestException('Market does not exist');
    }
    const outcomeMap = new Map<
      string,
      {
        outcomeId: string;
        outcomeName: string;
        outcomeColor: string | null;
        history: {
          time: Date;
          fairPrice: number | null;
          totalVolume: number;
        }[];
      }
    >();
    for (const o of market.outcomes) {
      outcomeMap.set(o.id, {
        outcomeId: o.id,
        outcomeName: o.name,
        outcomeColor: o.color,
        history: [],
      });
    }
    const conditions: string[] = ['market_id = $1'];
    const values: any[] = [id];
    let i = 2;
    if (from) {
      conditions.push(`time >= $${i++}`);
      values.push(from);
    }
    if (to) {
      conditions.push(`time <= $${i++}`);
      values.push(to);
    }
    const sql = `
      SELECT
        time,
        outcome_id,
        fair_price,
        total_volume
      FROM market_data
      WHERE ${conditions.join(' AND ')}
      ORDER BY outcome_id, time ASC
    `;
    const { rows } = await this.timeseriesService.query(sql, values);
    for (const row of rows) {
      const entry = outcomeMap.get(row.outcome_id as string);
      if (!entry) continue;
      entry.history.push({
        time: row.time as Date,
        fairPrice: row.fair_price !== null ? Number(row.fair_price) : null,
        totalVolume: Number(row.total_volume),
      });
    }
    return {
      success: true,
      data: Array.from(outcomeMap.values()),
    };
  }

  private async getLatestData(
    outcomes: {
      id: string;
      name: string;
      color: string | null;
    }[],
  ) {
    if (!outcomes.length) return [];
    const sql = `
      SELECT DISTINCT ON (outcome_id)
        outcome_id,
        fair_price,
        total_volume
      FROM market_data
      WHERE outcome_id = ANY($1)
      ORDER BY outcome_id, time DESC;
    `;
    const { rows } = await this.timeseriesService.query(sql, [
      outcomes.map((o) => o.id),
    ]);
    const rowByOutcomeId = new Map<string, QueryResultRow>();
    for (const row of rows) {
      rowByOutcomeId.set(row.outcome_id as string, row);
    }
    return outcomes.map((oi) => {
      const row = rowByOutcomeId.get(oi.id);
      if (!row) {
        return {
          outcomeId: oi.id,
          outcomeName: oi.name,
          outcomeColor: oi.color,
          fairPrice: null,
          totalVolume: 0,
        };
      }
      return {
        outcomeId: oi.id,
        outcomeName: oi.name,
        outcomeColor: oi.color,
        fairPrice: Number(row.fair_price! as number),
        totalVolume: Number(row.total_volume! as number),
      };
    });
  }

  private async seedData(
    outcomes: Array<{ id: string; name: string; marketId: number }>,
    marketId: number,
  ) {
    const SEED_QUANTITY = 1000;
    // Calculate fair price based on number of outcomes
    // For 3 outcomes: each starts at ~33.33¢
    const numOutcomes = outcomes.length;
    const fairPrice = Math.round(100 / numOutcomes); // 33 for 3 outcomes
    // Define spread around fair price
    const SPREAD_PERCENTAGE = 0.2; // 20% spread
    const spread = Math.round(fairPrice * SPREAD_PERCENTAGE);
    const buyPrice = Math.max(1, fairPrice - spread); // Platform buys at lower price
    const sellPrice = Math.min(99, fairPrice + spread); // Platform sells at higher price
    for (const outcome of outcomes) {
      await this.placePlatformOrder({
        accountId: PLATFORM_ACCOUNT_ID,
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        marketId: marketId,
        side: OrderSide.Buy,
        price: buyPrice,
        quantity: SEED_QUANTITY,
      });
      await this.placePlatformOrder({
        accountId: PLATFORM_ACCOUNT_ID,
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        marketId: marketId,
        side: OrderSide.Sell,
        price: sellPrice,
        quantity: SEED_QUANTITY,
      });
    }
  }

  private async placePlatformOrder(params: {
    accountId: number;
    outcomeId: string;
    outcomeName: string;
    marketId: number;
    side: OrderSide;
    price: number;
    quantity: number;
  }) {
    const {
      accountId,
      outcomeId,
      outcomeName,
      marketId,
      side,
      price,
      quantity,
    } = params;
    // For platform orders, we SKIP balance checks and canSell checks
    // The platform account should have unlimited/high balance
    const eventData: OrderNewEvent = {
      type: 'order.new',
      outcome_id: outcomeId,
      outcome_name: outcomeName,
      market_id: marketId,
      account_id: accountId,
      side: side,
      order_type: 'LIMIT',
      price: price,
      qty_remaining: quantity,
      qty_original: quantity,
      time_in_force: TimeInForce.GTC,
    };
    await this.redisPublisherService.pushOrderCommand(eventData);
  }
}
