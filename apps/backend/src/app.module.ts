import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { AdminModule } from './admin/admin.module';
import configuration from './config/configuration';
import { MarketCategoryModule } from './market-category/market-category.module';
import { RoleModule } from './role/role.module';
import { MarketModule } from './market/market.module';
import { OutcomeModule } from './outcome/outcome.module';
import { CommentModule } from './market/comment/comment.module';
import { RedisModule } from './redis/redis.module';
import { OrderModule } from './order/order.module';
import { FillModule } from './fill/fill.module';
import { WsModule } from './websocket/ws.module';
import { TimeseriesModule } from './timeseries/timeseries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    AuthModule,
    AccountsModule,
    AdminModule,
    MarketCategoryModule,
    RoleModule,
    MarketModule,
    OutcomeModule,
    CommentModule,
    RedisModule,
    OrderModule,
    FillModule,
    WsModule,
    TimeseriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
