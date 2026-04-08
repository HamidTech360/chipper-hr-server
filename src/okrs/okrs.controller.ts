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
import { OkrsService } from './okrs.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { CreateOkrDto } from './dto/create-okr.dto';
import { UpdateOkrDto } from './dto/update-okr.dto';
import { SelfScoreDto } from './dto/self-score.dto';
import { ManagerReviewDto } from './dto/manager-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OkrType, OkrStatus } from '@prisma/client';

@Controller('okrs')
@UseGuards(JwtAuthGuard)
export class OkrsController {
  constructor(private okrsService: OkrsService) {}

  @Post('periods')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async createPeriod(@Body() createDto: CreatePeriodDto) {
    return this.okrsService.createPeriod(createDto);
  }

  @Get('periods')
  async findAllPeriods(@CurrentUser('organizationId') orgId: string) {
    return this.okrsService.findAllPeriods(orgId);
  }

  @Get('periods/:id')
  async findPeriodById(@Param('id') id: string) {
    return this.okrsService.findPeriodById(id);
  }

  @Put('periods/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updatePeriod(
    @Param('id') id: string,
    @Body() updateDto: UpdatePeriodDto,
  ) {
    return this.okrsService.updatePeriod(id, updateDto);
  }

  @Put('periods/:id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async activatePeriod(@Param('id') id: string) {
    return this.okrsService.activatePeriod(id);
  }

  @Put('periods/:id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async togglePeriodStatus(@Param('id') id: string) {
    return this.okrsService.togglePeriodStatus(id);
  }

  @Post()
  async createOkr(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
    @CurrentUser('organizationId') organizationId: string,
    @Body() createDto: CreateOkrDto,
  ) {
    return this.okrsService.createOkr(createDto, userId, role, organizationId);
  }

  @Get()
  async findAllOkrs(
    @CurrentUser('organizationId') orgId: string,
    @Query('periodId') periodId?: string,
    @Query('type') type?: OkrType,
    @Query('status') status?: OkrStatus,
  ) {
    return this.okrsService.findAllOkrs(orgId, { periodId, type, status });
  }

  @Get('my-okrs')
  async findMyOkrs(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
    @Query('periodId') periodId?: string,
  ) {
    const okrs = await this.okrsService.findMyOkrs(orgId, userId);
    if (periodId) {
      return okrs.filter(o => o.periodId === periodId);
    }
    return okrs;
  }

  @Get('team-okrs')
  async findTeamOkrs(
    @CurrentUser('organizationId') orgId: string,
    @Query('periodId') periodId?: string,
  ) {
    const okrs = await this.okrsService.findTeamOkrs(orgId);
    if (periodId) {
      return okrs.filter(o => o.periodId === periodId);
    }
    return okrs;
  }

  @Get('company-okrs')
  async findCompanyOkrs(
    @CurrentUser('organizationId') orgId: string,
    @Query('periodId') periodId?: string,
  ) {
    const okrs = await this.okrsService.findCompanyOkrs(orgId);
    if (periodId) {
      return okrs.filter(o => o.periodId === periodId);
    }
    return okrs;
  }

  @Get('pending-approval')
  async findPendingApproval(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
    @Query('periodId') periodId?: string,
  ) {
    const okrs = await this.okrsService.findPendingApproval(orgId, userId);
    if (periodId) {
      return okrs.filter(o => o.periodId === periodId);
    }
    return okrs;
  }

  @Get('to-review')
  async findToReview(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
    @Query('periodId') periodId?: string,
  ) {
    const okrs = await this.okrsService.findToReview(orgId, userId);
    if (periodId) {
      return okrs.filter(o => o.periodId === periodId);
    }
    return okrs;
  }

  @Get(':id')
  async findOkrById(@Param('id') id: string) {
    return this.okrsService.findOkrById(id);
  }

  @Put(':id')
  async updateOkr(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateDto: UpdateOkrDto,
  ) {
    return this.okrsService.updateOkr(id, updateDto, userId);
  }

  @Put(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async toggleOkrStatus(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.okrsService.toggleOkrStatus(id, userId, role);
  }

  @Put(':id/approve')
  async approveOkr(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.okrsService.approveOkr(id, userId);
  }

  @Put(':id/reject')
  async rejectOkr(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.okrsService.rejectOkr(id, userId);
  }

  @Put(':id/self-score')
  async selfScore(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() scores: SelfScoreDto,
  ) {
    return this.okrsService.selfScore(id, userId, scores);
  }

  @Put(':id/manager-review')
  async managerReview(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() scores: ManagerReviewDto,
  ) {
    return this.okrsService.managerReview(id, userId, scores);
  }
}
