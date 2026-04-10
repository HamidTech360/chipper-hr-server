import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getStats(orgId);
  }

  @Get('organization')
  async getOrganization(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getOrganization(orgId);
  }

  @Get('departments')
  async getDepartmentStats(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getDepartmentStats(orgId);
  }

  @Get('okr-periods')
  async getRecentOkrPeriods(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getRecentOkrPeriods(orgId);
  }

  @Get('activity')
  async getRecentActivity(@CurrentUser('organizationId') orgId: string) {
    return this.dashboardService.getRecentActivity(orgId);
  }
}
