import { Module } from '@nestjs/common';
import { SuccessionService } from './succession.service';
import { SuccessionController } from './succession.controller';

@Module({
  controllers: [SuccessionController],
  providers: [SuccessionService],
  exports: [SuccessionService],
})
export class SuccessionModule {}
