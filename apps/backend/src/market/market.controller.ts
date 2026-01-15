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
import { ROLES_TO_ID_MAPPING } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { MarketService } from './market.service';
import { z } from 'zod';
import { type AppRequest } from 'src/@types/express';

const createMarketSchema = z
  .object({
    name: z.string().min(3),
    marketCategoryId: z.number().min(1),
    outcomes: z.array(z.string().min(3)).min(2),
    information: z.json().optional(),
    ruleBook: z.string().optional(),
    rules: z.string().optional(),
    startsAt: z.date(),
    endsAt: z.date(),
  })
  .refine((data) => new Date(data.startsAt) >= new Date(), {
    message: 'startsAt cannot be in the past',
    path: ['startsAt'],
  })
  .refine((data) => new Date(data.endsAt) >= new Date(), {
    message: 'endsAt cannot be in the past',
    path: ['endsAt'],
  })
  .refine((data) => new Date(data.endsAt) >= new Date(data.startsAt), {
    message: 'endsAt cannot be before startsAt',
    path: ['endsAt'],
  });

export type TCreateMarketSchema = z.infer<typeof createMarketSchema>;

@Controller('market')
@UseGuards(AuthGuard, RolesGuard)
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('')
  @Roles(ROLES_TO_ID_MAPPING.ADMIN)
  async createMarket(@Body() raw: any) {
    const parsed = await createMarketSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.marketService.createMarket(parsed.data);
  }

  @Post(':id/activate')
  @Roles(ROLES_TO_ID_MAPPING.ADMIN)
  async activateMarket(@Param() id: number) {
    return await this.marketService.activateMarket(id);
  }

  @Get('')
  async getMarkets(@Req() req: AppRequest, @Query() type?: 'inactive') {
    const userRoles = req.user.roles;
    if (
      !userRoles.includes(ROLES_TO_ID_MAPPING.ADMIN) &&
      type &&
      type === 'inactive'
    ) {
      throw new UnauthorizedException('You are not authorized');
    }
    return await this.marketService.getMarkets(type);
  }

  @Get(':id')
  async getMarketById(@Param() id: number) {
    return await this.marketService.getMarketById(id);
  }
}
