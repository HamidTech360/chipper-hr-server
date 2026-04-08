import { IsInt, Min, Max, IsOptional, IsObject } from 'class-validator';

export class SelfScoreDto {
  @IsObject()
  keyResults: Record<string, { targetValue?: number; realizedValue?: number }>;
}
