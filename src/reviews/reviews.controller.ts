import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('cycles')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async createCycle(@Body() createDto: CreateCycleDto) {
    const cycle = await this.reviewsService.createCycle(createDto);
    await this.reviewsService.createReviewTasks(cycle.id);
    return cycle;
  }

  @Get('cycles')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async findAllCycles(@CurrentUser('organizationId') orgId: string) {
    return this.reviewsService.findAllCycles(orgId);
  }

  @Get('cycles/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async findCycleById(@Param('id') id: string) {
    return this.reviewsService.findCycleById(id);
  }

  @Put('cycles/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updateCycle(
    @Param('id') id: string,
    @Body() updateDto: UpdateCycleDto,
  ) {
    return this.reviewsService.updateCycle(id, updateDto);
  }

  @Put('cycles/:id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async activateCycle(@Param('id') id: string) {
    return this.reviewsService.activateCycle(id);
  }

  @Put('cycles/:id/pause')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async pauseCycle(@Param('id') id: string) {
    return this.reviewsService.pauseCycle(id);
  }

  @Put('cycles/:id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async closeCycle(@Param('id') id: string) {
    return this.reviewsService.closeCycle(id);
  }

  @Get('tasks')
  async getMyTasks(
    @CurrentUser('userId') userId: string,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.reviewsService.getMyTasks(userId, orgId);
  }

  @Get('submissions/:id')
  async getSubmissionById(@Param('id') id: string) {
    return this.reviewsService.getSubmissionById(id);
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
}
