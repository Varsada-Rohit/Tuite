import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createTenantScopingExtension } from './prisma-tenant.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to PostgreSQL...');
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from PostgreSQL...');
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }

  /**
   * Returns a Prisma Client extended with tenant scoping.
   * All queries on tenant-scoped models will automatically inject the `tenant_id`.
   * Use this for all business logic executed on behalf of a user.
   */
  withTenant(tenantId: string) {
    return this.$extends(createTenantScopingExtension(tenantId));
  }

  /**
   * Returns the raw Prisma Client without any tenant scoping.
   * MUST ONLY BE USED for Super Admin operations or internal auth flows.
   */
  withoutTenant() {
    return this;
  }
}
