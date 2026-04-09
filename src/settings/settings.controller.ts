import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('organization')
  async getOrganization(@CurrentUser('organizationId') orgId: string) {
    return this.settingsService.getOrganization(orgId);
  }

  @Put('organization')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updateOrganization(
    @CurrentUser('organizationId') orgId: string,
    @Body() data: { name?: string; industry?: string; size?: string; country?: string; website?: string },
  ) {
    return this.settingsService.updateOrganization(orgId, data);
  }

  @Post('departments')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async createDepartment(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { name: string },
  ) {
    return this.settingsService.createDepartment(orgId, body.name);
  }

  @Put('departments/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return this.settingsService.updateDepartment(id, body.name);
  }

  @Delete('departments/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async deleteDepartment(@Param('id') id: string) {
    return this.settingsService.deleteDepartment(id);
  }

  @Get('users/role/:role')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async getUsersByRole(
    @CurrentUser('organizationId') orgId: string,
    @Param('role') role: Role,
  ) {
    return this.settingsService.getUsersByRole(orgId, role);
  }

  @Get('users/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async getRoleStats(@CurrentUser('organizationId') orgId: string) {
    return this.settingsService.getRoleStats(orgId);
  }

  @Put('users/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: Role },
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.settingsService.updateUserRole(userId, body.role, orgId);
  }

  @Get('profile')
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.settingsService.getEmployeeProfile(userId);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
      avatar?: string;
    },
  ) {
    return this.settingsService.updateEmployeeProfile(userId, data);
  }
}
