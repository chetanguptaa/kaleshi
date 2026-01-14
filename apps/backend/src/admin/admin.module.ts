import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  providers: [AdminService, PrismaService, AuthService],
  controllers: [AdminController],
})
export class AdminModule {}
