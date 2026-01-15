import { Module } from '@nestjs/common';
import { OutcomeService } from './outcome.service';
import { OutcomeController } from './outcome.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  providers: [OutcomeService, PrismaService, AuthService],
  controllers: [OutcomeController],
})
export class OutcomeModule {}
