import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { REDIS_PUBLISHER, REDIS_SUBSCRIBER } from './redis.constants';
import { RedisPublisherService } from './redis.publisher.service';
import { RedisSubscriberService } from './redis.subscriber.service';
import { WsModule } from 'src/websocket/ws.module';

@Global()
@Module({
  imports: [ConfigModule, WsModule],
  providers: [
    {
      provide: REDIS_PUBLISHER,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get<string>('REDIS_URL'),
        });
        client.on('error', (e) => console.error('Redis publisher error', e));
        await client.connect();
        return client;
      },
    },
    {
      provide: REDIS_SUBSCRIBER,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const base = createClient({ url: configService.get('REDIS_URL') });
        base.on('error', (e) => console.error('Redis base error', e));
        await base.connect();
        const subscriber = base.duplicate();
        subscriber.on('error', (e) =>
          console.error('Redis subscriber error', e),
        );
        await subscriber.connect();
        return subscriber;
      },
    },
    RedisPublisherService,
    RedisSubscriberService,
  ],
  exports: [RedisPublisherService, RedisSubscriberService],
})
export class RedisModule {}
