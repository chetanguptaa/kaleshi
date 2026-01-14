import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAccount(id: number) {
    const account = await this.prismaService.account.findFirst({
      where: {
        userId: id,
      },
    });
    if (account) {
      throw new BadRequestException('Account already exist');
    } else {
      return await this.prismaService.account.create({
        data: {
          userId: id,
        },
      });
    }
  }
}
