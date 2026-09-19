import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extracts the tenant_id from the authenticated user's JWT payload.
 * Returns null for SUPER_ADMIN users.
 *
 * @example
 * @Get('data')
 * getData(@CurrentTenant() tenantId: string | null) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown> | undefined;

    return (user?.tenantId as string | null) ?? null;
  },
);
