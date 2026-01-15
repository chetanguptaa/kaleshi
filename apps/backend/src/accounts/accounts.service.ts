import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAccount(id: number) {
    try {
      const newUser = await this.prismaService.account.create({
        data: {
          userId: id,
        },
      });
      return { success: true, id: newUser.id };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Account for this user already exists');
      }
      throw e;
    }
  }
}
