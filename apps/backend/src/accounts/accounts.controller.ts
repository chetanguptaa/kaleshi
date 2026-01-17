import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AccountsService } from './accounts.service';
import { type AppRequest } from 'src/@types/express';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES } from 'src/constants';

@Controller('accounts')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES.COMMON)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('')
  async createAccount(@Req() req: AppRequest) {
    const userId = req.user.sub;
    const account = await this.accountsService.createAccount(userId);
    return {
      success: true,
      accountId: account.id,
    };
  }

  @Get('')
  async getUserAccount(@Req() req: AppRequest) {
    const userId = req.user.sub;
    return await this.accountsService.getUserAccount(userId);
  }
}
