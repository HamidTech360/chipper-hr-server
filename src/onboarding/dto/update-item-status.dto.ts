import { IsEnum } from 'class-validator';

export class UpdateItemStatusDto {
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
