import { IsObject, IsOptional } from 'class-validator';

export class SubmitReviewDto {
  @IsObject()
  answers: Record<string, any>;
}
