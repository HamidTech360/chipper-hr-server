import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantStorageService } from './tenant-storage.service';

export interface TenantAwareQuery {
  tenantWhere: { organizationId: string };
  requireTenant: () => string;
}

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantStorageService => {
    return ctx.switchToHttp().getRequest().tenantStorage;
  },
);

export function createTenantQuery(organizationId: string): TenantAwareQuery {
  return {
    tenantWhere: { organizationId },
    requireTenant: () => {
      if (!organizationId) {
        throw new Error('Tenant context is required but not available');
      }
      return organizationId;
    },
  };
}
