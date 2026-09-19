import { SetMetadata } from '@nestjs/common';
import { Role } from '@tuite/shared-types';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to specific user roles.
 * Used in conjunction with RolesGuard.
 *
 * @example
 * @Roles(Role.SUPER_ADMIN)
 * @Get('admin/tenants')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
