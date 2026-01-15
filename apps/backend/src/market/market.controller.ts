import {
  BadRequestException,
  Body,
  Controller,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES_TO_ID_MAPPING } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { MarketService } from './market.service';
import { z } from 'zod';

const createMarketSchema = z.object({
  name: z.string().min(3),
  marketCategoryId: z.number().min(1),
  outcomes: z.array(z.string().min(3)).min(2),
  information: z.json().optional(),
  ruleBook: z.string().optional(),
  rules: z.string().optional(),
});

export type TCreateMarketSchema = z.infer<typeof createMarketSchema>;

@Controller('market')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES_TO_ID_MAPPING.ADMIN)
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  async createMarket(@Body() raw: any) {
    const parsed = await createMarketSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.marketService.createMarket(parsed.data);
  }
}
