import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.dashboardService.getStats(orgId, userId, role);
  }

  @Get('departments')
  async getDepartmentStats(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getDepartmentStats(orgId);
  }

  @Get('activity')
  async getRecentActivity(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getRecentActivity(orgId);
  }
}
