import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES_TO_ID_MAPPING } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { OutcomeService } from './outcome.service';

@Controller('outcome')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES_TO_ID_MAPPING.ADMIN)
export class OutcomeController {
  constructor(private readonly outcomeService: OutcomeService) {}
}
