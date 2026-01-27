import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { timescalePool } from './timeseries.client';
import { QueryResultRow } from 'pg';

@Injectable()
export class TimeseriesService implements OnModuleDestroy {
  async onModuleDestroy() {
    await timescalePool.end();
  }

  async query<T extends QueryResultRow>(sql: string, params: any[] = []) {
    return timescalePool.query<T>(sql, params);
  }
}
