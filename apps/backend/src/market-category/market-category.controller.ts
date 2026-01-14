import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES_TO_ID_MAPPING } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { MarketCategoryService } from './market-category.service';
import { type AppRequest } from 'src/@types/express';
import { z } from 'zod';

const createMarketCategorySchema = z
  .object({
    name: z.string().min(3),
    information: z.json().optional(),
  })
  .strict();

export type TCreateMarketCategorySchema = z.infer<
  typeof createMarketCategorySchema
>;

@Controller('market-category')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES_TO_ID_MAPPING.ADMIN)
export class MarketCategoryController {
  constructor(private readonly marketCategoryService: MarketCategoryService) {}

  @Post('')
  async createMarketCategory(@Req() req: AppRequest, @Body() raw: any) {
    if (!req.user) return;
    const parsed = await createMarketCategorySchema.safeParseAsync(raw);
    if (!parsed.success) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.marketCategoryService.createMarketCategory(
      req.user.sub,
      parsed.data,
    );
  }
}
