import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TCreateRoleSchema } from './role.controller';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async createRole(body: TCreateRoleSchema) {
    const name = body.name.toUpperCase();
    try {
      const newRole = await this.prismaService.role.create({
        data: { name },
      });
      return { success: true, id: newRole.id };
    } catch (e: any) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Role with this name already exists');
      }
      throw e;
    }
  }
}
