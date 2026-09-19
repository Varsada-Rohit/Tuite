import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public — bypasses JWT authentication.
 * Use on endpoints like /auth/verify-phone, /tenants/resolve.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
