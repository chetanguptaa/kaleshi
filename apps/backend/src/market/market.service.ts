import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateMarketSchema } from './market.controller';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { ROLES } from 'src/constants';
import { TimeseriesService } from 'src/timeseries/timeseries.service';
import { QueryResultRow } from 'pg';

@Injectable()
export class MarketService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly timeseriesService: TimeseriesService,
  ) {}

  async createMarket(body: TCreateMarketSchema) {
    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const newMarket = await tx.market.create({
          data: {
            name: body.name,
            marketCategoryId: body.marketCategoryId,
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            metadata: body.metadata ?? {},
            ruleBook: body.ruleBook ?? null,
            rules: body.rules ?? null,
          },
        });
        await tx.outcome.createMany({
          data: body.outcomes.map((o) => ({
            name: o.name,
            color: o.color,
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

  async getMarketById(userRoles: string[], id: number) {
    const market = await this.prismaService.market.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        comments: {
          select: {
            comment: true,
            account: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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
        isActive: true,
        startsAt: true,
        endsAt: true,
      },
    });
    if (!market || (!userRoles.includes(ROLES.ADMIN) && !market.isActive)) {
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
}
