import { Module } from '@nestjs/common';
import { OkrsService } from './okrs.service';
import { OkrsController } from './okrs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OkrsController],
  providers: [OkrsService],
  exports: [OkrsService],
})
export class OkrsModule {}
