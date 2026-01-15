import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ROLES_TO_ID_MAPPING } from 'src/constants';
import { Roles } from 'src/decorators/roles.decorator';
import { RoleService } from './role.service';
import { z } from 'zod';

const createRoleSchema = z
  .object({
    name: z.string().min(3),
  })
  .strict();

export type TCreateRoleSchema = z.infer<typeof createRoleSchema>;

@Controller('role')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES_TO_ID_MAPPING.ADMIN)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('')
  async createRole(@Body() raw: any) {
    const parsed = await createRoleSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.roleService.createRole(parsed.data);
  }
}
