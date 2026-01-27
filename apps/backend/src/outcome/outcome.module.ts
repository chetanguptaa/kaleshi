import { Module } from '@nestjs/common';
import { OutcomeService } from './outcome.service';
import { OutcomeController } from './outcome.controller';
import { AuthService } from 'src/auth/auth.service';
import { TimeseriesService } from 'src/timeseries/timeseries.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [OutcomeService, TimeseriesService, PrismaService, AuthService],
  controllers: [OutcomeController],
})
export class OutcomeModule {}
