import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  async create(@Body() createOrgDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrgDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR)
  async update(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrgDto);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR)
  async getStats(@Param('id') id: string) {
    return this.organizationsService.getStats(id);
  }
}
