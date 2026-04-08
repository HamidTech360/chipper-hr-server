import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantStorageService } from './tenant-storage.service';
import { TenantMiddleware } from './tenant.middleware';

@Global()
@Module({
  providers: [TenantStorageService],
  exports: [TenantStorageService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
