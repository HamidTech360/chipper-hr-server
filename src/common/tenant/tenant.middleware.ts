import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantStorageService, TenantContext } from './tenant-storage.service';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    organizationId: string;
    role: string;
    email: string;
  };
  tenantStorage: TenantStorageService;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantStorage: TenantStorageService) {}

  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.decodeToken(token);

        if (payload) {
          const context: TenantContext = {
            organizationId: payload.organizationId,
            userId: payload.userId,
            role: payload.role,
          };

          req.user = {
            userId: payload.userId,
            organizationId: payload.organizationId,
            role: payload.role,
            email: payload.email,
          };

          req.tenantStorage = this.tenantStorage;

          TenantStorageService.run(context, () => {
            next();
          });
          return;
        }
      } catch {
        // Token invalid, continue without user context
      }
    }

    next();
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}

export function getCurrentOrgId(): string | null {
  return TenantStorageService.getStore()?.organizationId || null;
}

export function getCurrentUserId(): string | null {
  return TenantStorageService.getStore()?.userId || null;
}

export function getCurrentRole(): string | null {
  return TenantStorageService.getStore()?.role || null;
}
