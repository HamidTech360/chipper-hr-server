import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TenantStorageService } from '../common/tenant/tenant-storage.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private tenantStorage: TenantStorageService) {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  getOrganizationId(): string | null {
    return this.tenantStorage.getOrganizationId();
  }

  getUserId(): string | null {
    return this.tenantStorage.getUserId();
  }

  requireOrganizationId(): string {
    const orgId = this.getOrganizationId();
    if (!orgId) {
      throw new Error('Organization ID is required but not available in tenant context');
    }
    return orgId;
  }

  addTenantFilter<T>(where: T): T & { organizationId: string } {
    const orgId = this.requireOrganizationId();
    return {
      ...where,
      organizationId: orgId,
    } as T & { organizationId: string };
  }

  async tenantQuery<T>(
    callback: (prisma: PrismaService) => Promise<T>
  ): Promise<T> {
    const orgId = this.requireOrganizationId();
    return callback(this);
  }
}
