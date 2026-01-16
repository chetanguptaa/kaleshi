import { Module } from '@nestjs/common';
import { FillService } from './fill.service';
import { FillController } from './fill.controller';

@Module({
  providers: [FillService],
  controllers: [FillController],
})
export class FillModule {}
