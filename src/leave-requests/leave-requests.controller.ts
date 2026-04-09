import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto, ApproveLeaveRequestDto, RejectLeaveRequestDto } from './dto/leave-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard)
export class LeaveRequestsController {
  constructor(private leaveRequestsService: LeaveRequestsService) {}

  @Post()
  async create(
    @Body() createDto: CreateLeaveRequestDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.leaveRequestsService.create(createDto, userId);
  }

  @Get()
  async findAllForHR(@CurrentUser('organizationId') orgId: string) {
    return this.leaveRequestsService.findAllForHR(orgId);
  }

  @Get('my-requests')
  async findMyRequests(@CurrentUser('userId') userId: string) {
    return this.leaveRequestsService.findMyRequests(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  @Put(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async approve(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ApproveLeaveRequestDto,
  ) {
    return this.leaveRequestsService.approve(id, userId, dto);
  }

  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
  ) {
    return this.leaveRequestsService.reject(id, dto);
  }
}
