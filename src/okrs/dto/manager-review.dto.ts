import { IsInt, Min, Max, IsOptional, IsObject } from 'class-validator';

export class ManagerReviewDto {
  @IsObject()
  keyResults: Record<string, { managerValue?: number }>;
}
