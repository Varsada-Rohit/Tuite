import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database';
declare class SeedAdminDto {
    /** E.164 phone for the Super Admin. Defaults to the placeholder in prisma/seed.ts. */
    phone?: string;
}
/**
 * TEMPORARY — remove this module after seeding the Super Admin.
 * Mirrors apps/api/prisma/seed.ts. Disabled (404) unless SEED_TOKEN is set,
 * and requires a matching `x-seed-token` header.
 */
export declare class SeedController {
    private readonly config;
    private readonly prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    seedAdmin(token: string | undefined, dto: SeedAdminDto): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        full_name: string | null;
    }>;
}
export {};
//# sourceMappingURL=seed.controller.d.ts.map