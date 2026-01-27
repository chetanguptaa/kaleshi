import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { OutcomeService } from './outcome.service';

@Controller('outcome')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES.COMMON)
export class OutcomeController {
  constructor(private readonly outcomeService: OutcomeService) {}

  @Get(':id/depth')
  async getBookDepth(@Param('id') id: string) {
    return await this.outcomeService.getBookDepth(id);
  }
}
