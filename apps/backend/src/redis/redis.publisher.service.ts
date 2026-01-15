import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_PUBLISHER, ORDER_COMMAND_CHANNEL } from './redis.constants';

@Injectable()
export class RedisPublisherService {
  constructor(
    @Inject(REDIS_PUBLISHER)
    private readonly publisher: RedisClientType,
  ) {}

  async publishOrderCommand(payload: Record<string, any>): Promise<void> {
    await this.publisher.publish(
      ORDER_COMMAND_CHANNEL,
      JSON.stringify(payload),
    );
  }

  onModuleDestroy() {
    return this.publisher.quit();
  }
}
