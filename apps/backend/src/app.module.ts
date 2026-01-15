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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
