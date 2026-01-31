import { Controller, Get, Param } from '@nestjs/common';
import { OutcomeService } from './outcome.service';

@Controller('outcome')
export class OutcomeController {
  constructor(private readonly outcomeService: OutcomeService) {}

  @Get(':id/depth')
  async getBookDepth(@Param('id') id: string) {
    return await this.outcomeService.getBookDepth(id);
  }
}
