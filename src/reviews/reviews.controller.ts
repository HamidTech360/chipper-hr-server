import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewParticipantsDto } from './dto/create-review-participants.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async createReview(
    @CurrentUser('organizationId') orgId: string,
    @Body() createDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(createDto, orgId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async findAllReviews(@CurrentUser('organizationId') orgId: string) {
    return this.reviewsService.findAllReviews(orgId);
  }

  @Get('submissions')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async getAllSubmissions(@CurrentUser('organizationId') orgId: string) {
    return this.reviewsService.getAllSubmissions(orgId);
  }

  @Get('my-tasks')
  async getMyTasks(@CurrentUser('userId') userId: string) {
    return this.reviewsService.getMyTasks(userId);
  }

  @Get('submissions/:id')
  async getSubmissionById(@Param('id') id: string) {
    return this.reviewsService.getSubmissionById(id);
  }

  @Get('my-submissions/:id')
  async getMySubmissionById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.reviewsService.getMySubmissionById(id, userId);
  }

  @Put('submissions/:id')
  async saveSubmission(
    @Param('id') id: string,
    @Body() body: { answers: Record<string, any> },
  ) {
    return this.reviewsService.saveSubmission(id, body.answers);
  }

  @Post('submissions/:id/submit')
  async submitReview(
    @Param('id') id: string,
    @Body() body: { answers: Record<string, any> },
  ) {
    return this.reviewsService.submitReview(id, body.answers);
  }

  @Post('participants')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async addParticipants(@Body() createDto: CreateReviewParticipantsDto) {
    return this.reviewsService.addParticipants(createDto.reviewId, createDto.participants);
  }

  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async activateReview(@Param('id') id: string) {
    return this.reviewsService.activateReview(id);
  }

  @Put(':id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async closeReview(@Param('id') id: string) {
    return this.reviewsService.closeReview(id);
  }

  @Put(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async deactivateReview(@Param('id') id: string) {
    return this.reviewsService.deactivateReview(id);
  }
}
