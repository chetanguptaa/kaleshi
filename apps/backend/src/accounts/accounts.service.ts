import { BadRequestException, Injectable } from '@nestjs/common';
import { add } from 'date-fns';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async createAccount(id: number) {
    try {
      const { newAccount, session } = await this.prismaService.$transaction(
        async (tx) => {
          const newAccount = await tx.account.create({
            data: {
              userId: id,
            },
            include: {
              user: {
                include: {
                  userRoles: {
                    include: {
                      role: true,
                    },
                  },
                },
              },
            },
          });
          await tx.session.deleteMany({
            where: { userId: newAccount.userId },
          });
          const session = await this.prismaService.session.create({
            data: {
              userId: newAccount.userId,
              expiresAt: add(new Date(), { days: 7 }),
            },
          });
          return { newAccount, session };
        },
      );
      const token = this.authService.signJwt({
        name: newAccount.user.name,
        email: newAccount.user.email,
        sub: newAccount.user.id,
        roles: newAccount.user.userRoles.map((ur) => ur.role.name),
        accountId: newAccount.id,
        sid: session.id,
      });
      return { success: true, id: newAccount.id, token };
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
