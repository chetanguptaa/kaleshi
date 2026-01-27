import { Module } from '@nestjs/common';
import { TimeseriesService } from './timeseries.service';

@Module({
  providers: [TimeseriesService],
  controllers: [],
})
export class TimeseriesModule {}
