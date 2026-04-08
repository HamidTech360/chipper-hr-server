import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: string;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantStorageService {
  private static asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  static getStore(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  static run<T>(context: TenantContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  getOrganizationId(): string | null {
    const store = TenantStorageService.getStore();
    return store?.organizationId || null;
  }

  getUserId(): string | null {
    const store = TenantStorageService.getStore();
    return store?.userId || null;
  }

  getRole(): string | null {
    const store = TenantStorageService.getStore();
    return store?.role || null;
  }
}
