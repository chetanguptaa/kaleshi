import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { MarketCategoryService } from './market-category.service';
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

const createMarketCategoryChildSchema = z
  .object({
    name: z.string().min(3),
    information: z.json().optional(),
    parentId: z.number().int().min(1),
  })
  .strict();

export type TCreateMarketCategoryChildSchema = z.infer<
  typeof createMarketCategoryChildSchema
>;

@Controller('market-category')
export class MarketCategoryController {
  constructor(private readonly marketCategoryService: MarketCategoryService) {}

  @Post('')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createMarketCategory(@Body() raw: any) {
    const parsed = await createMarketCategorySchema.safeParseAsync(raw);
    if (!parsed.success) {
      console.log('hi there what is the error ', JSON.stringify(parsed.error));
      throw new BadRequestException('Invalid request body');
    }
    return await this.marketCategoryService.createMarketCategory(parsed.data);
  }

  @Post('child')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createMarketCategoryChild(@Body() raw: any) {
    const parsed = await createMarketCategoryChildSchema.safeParseAsync(raw);
    if (!parsed.success) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.marketCategoryService.createMarketCategoryChild(
      parsed.data,
    );
  }

  @Get('')
  async getMarketCategories() {
    return await this.marketCategoryService.getMarketCategories();
  }

  @Get(':id')
  async getMarketCategoryById(@Param('id') id: string | number) {
    // TODO: Pending Logic
    if (id === 'trending' || id === 'all' || id === 'new') {
      return {
        success: true,
        markets: [],
      };
    }
    return await this.marketCategoryService.getMarketCategoryById(+id);
  }
}
