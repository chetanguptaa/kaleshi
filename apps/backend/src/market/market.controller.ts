import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { MarketService } from './market.service';
import { z } from 'zod';
import { type AppRequest } from 'src/@types/express';
import { MarketStatus } from 'generated/prisma/enums';

const hexColor = z
  .string()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    'color must be a valid hex color in the format #RRGGBB',
  );

const utcDate = z.preprocess((value) => {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    return date;
  }
  return value;
}, z.date());

const createMarketSchema = z
  .object({
    name: z.string().min(3),
    marketCategoryId: z.number().min(1),
    outcomes: z
      .array(
        z.object({
          name: z.string().min(3),
          color: hexColor,
        }),
      )
      .min(2),
    metadata: z.json().optional(),
    ruleBook: z.string().optional(),
    rules: z.string().optional(),
    // --- Time fields (UTC only) ---
    bettingStartAt: utcDate,
    bettingEndAt: utcDate,
    eventStartAt: utcDate,
    eventEndAt: utcDate,
  })
  .refine((data) => data.bettingStartAt.getTime() >= Date.now(), {
    message: 'bettingStartAt cannot be in the past',
    path: ['bettingStartAt'],
  })
  .refine((data) => data.bettingStartAt < data.bettingEndAt, {
    message: 'bettingEndAt must be after bettingStartAt',
    path: ['bettingEndAt'],
  })
  .refine((data) => data.bettingEndAt <= data.eventStartAt, {
    message: 'bettingEndAt must be before or at eventStartAt',
    path: ['bettingEndAt'],
  })
  .refine((data) => data.eventStartAt < data.eventEndAt, {
    message: 'eventEndAt must be after eventStartAt',
    path: ['eventEndAt'],
  });
export type TCreateMarketSchema = z.infer<typeof createMarketSchema>;

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createMarket(@Body() raw: any) {
    const parsed = await createMarketSchema.safeParseAsync(raw);
    if (parsed.error) {
      console.log('parsed error ', parsed.error);
      throw new BadRequestException('Invalid request body');
    }
    return await this.marketService.createMarket(parsed.data);
  }

  @Post(':id/activate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async activateMarket(@Param('id') id: number) {
    return await this.marketService.activateMarket(+id);
  }

  @Get('')
  async getMarkets(@Req() req: AppRequest, @Query() type?: MarketStatus) {
    const userRoles = req.user?.roles || [];
    if (
      !userRoles.includes(ROLES.ADMIN) &&
      type &&
      type === MarketStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException('You are not authorized');
    }
    return await this.marketService.getMarkets(type);
  }

  @Get(':id')
  async getMarketById(@Req() req: AppRequest, @Param('id') id: number) {
    const userRoles = req.user?.roles || [];
    return await this.marketService.getMarketById(userRoles, +id);
  }

  @Get(':id/market-data') // TO get the initial array of outcomeId -> fair price
  async getMarketData(@Param('id') id: number) {
    return await this.marketService.getMarketData(+id);
  }

  @Get(':id/market-data/history')
  async getMarketDataHistory(
    @Param('id') id: number,
    @Query('from') from?: Date,
    @Query('to') to?: Date,
  ) {
    return await this.marketService.getMarketDataHistory(+id, from, to);
  }
}
