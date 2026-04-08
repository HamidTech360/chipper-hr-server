import { Module } from '@nestjs/common';
import { PipsService } from './pips.service';
import { PipsController } from './pips.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PipsController],
  providers: [PipsService],
  exports: [PipsService],
})
export class PipsModule {}
