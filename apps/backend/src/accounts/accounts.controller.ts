import {
  Controller,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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

  async createAccount(@Req() req: AppRequest) {
    const user = req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('You are not authorized');
    }
    const account = await this.accountsService.createAccount(user.id);
    return {
      success: true,
      accountId: account.id,
    };
  }
}
