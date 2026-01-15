import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [RoleController],
  providers: [RoleService, AuthService, PrismaService],
})
export class RoleModule {}
