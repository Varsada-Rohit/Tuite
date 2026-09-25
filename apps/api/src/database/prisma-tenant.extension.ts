import { Prisma } from '@prisma/client';

/**
 * List of Prisma models that are tenant-scoped (have a `tenant_id` column).
 * The tenant-scoping extension will automatically inject `tenant_id` filters
 * for these models on all read, update, and delete operations.
 */
const TENANT_SCOPED_MODELS: string[] = ['User', 'TenantFeatureFlag', 'Batch'];

/**
 * Operations that should have the tenant_id injected into `where` clauses.
 */
const READ_OPERATIONS = [
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
] as const;

const WRITE_OPERATIONS = ['update', 'updateMany', 'delete', 'deleteMany'] as const;

/**
 * Creates a Prisma Client extension that automatically scopes all queries
 * to a specific tenant. This is the primary defense against cross-tenant
 * data leaks.
 *
 * Usage:
 *   const scopedClient = prisma.$extends(tenantScopingExtension('tenant-uuid'));
 *
 * Models NOT in TENANT_SCOPED_MODELS (e.g., Tenant, RefreshToken) are
 * passed through without modification.
 */
export function createTenantScopingExtension(tenantId: string) {
  return Prisma.defineExtension({
    name: 'tenant-scoping',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Skip non-tenant-scoped models
          if (!model || !TENANT_SCOPED_MODELS.includes(model)) {
            return query(args);
          }

          // Use type-safe access via Record casting
          const mutableArgs = args as Record<string, unknown>;

          // Inject tenant_id into read operations
          if ((READ_OPERATIONS as readonly string[]).includes(operation)) {
            const existingWhere = (mutableArgs.where as Record<string, unknown>) || {};
            mutableArgs.where = { ...existingWhere, tenant_id: tenantId };
            return query(args);
          }

          // Inject tenant_id into write operations (where clause)
          if ((WRITE_OPERATIONS as readonly string[]).includes(operation)) {
            const existingWhere = (mutableArgs.where as Record<string, unknown>) || {};
            mutableArgs.where = { ...existingWhere, tenant_id: tenantId };
            return query(args);
          }

          // Inject tenant_id into create operations (data)
          if (operation === 'create') {
            const existingData = (mutableArgs.data as Record<string, unknown>) || {};
            mutableArgs.data = { ...existingData, tenant_id: tenantId };
            return query(args);
          }

          if (operation === 'createMany') {
            const data = mutableArgs.data;
            if (Array.isArray(data)) {
              mutableArgs.data = data.map((item: Record<string, unknown>) => ({
                ...item,
                tenant_id: tenantId,
              }));
            } else {
              const existingData = (data as Record<string, unknown>) || {};
              mutableArgs.data = { ...existingData, tenant_id: tenantId };
            }
            return query(args);
          }

          // Upsert: scope both where and create
          if (operation === 'upsert') {
            const existingWhere = (mutableArgs.where as Record<string, unknown>) || {};
            mutableArgs.where = { ...existingWhere, tenant_id: tenantId };
            const existingCreate = (mutableArgs.create as Record<string, unknown>) || {};
            mutableArgs.create = { ...existingCreate, tenant_id: tenantId };
            return query(args);
          }

          // Fallback: pass through unmodified
          return query(args);
        },
      },
    },
  });
}
