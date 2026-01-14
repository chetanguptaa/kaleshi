import { Controller, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { ROLES_TO_ID_MAPPING } from 'src/constants';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES_TO_ID_MAPPING.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
}
