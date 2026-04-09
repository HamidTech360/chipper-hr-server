import { IsString, IsArray } from 'class-validator';

export class CreateReviewParticipantsDto {
  @IsString()
  reviewId: string;

  @IsArray()
  participants: {
    revieweeId: string;
    reviewerId: string;
  }[];
}
