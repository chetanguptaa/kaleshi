import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAccount(id: number) {
    try {
      const newAccount = await this.prismaService.account.create({
        data: {
          userId: id,
        },
      });
      return { success: true, id: newAccount.id };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Account for this user already exists');
      }
      throw e;
    }
  }

  async getUserAccount(userId: number) {
    const account = await this.prismaService.account.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        coins: true,
      },
    });
    if (!account) {
      throw new BadRequestException('Account for user does not exist');
    }
    return {
      success: true,
      account: {
        ...account,
        coins: this.normalizeCoins(account.coins),
      },
    };
  }

  private normalizeCoins(coins: number | null): number {
    if (!coins || coins <= 0) {
      return 0;
    }
    return coins / 100;
  }
}
