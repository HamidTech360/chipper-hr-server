import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { AssignChecklistDto } from './dto/assign-checklist.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, ChecklistType } from '@prisma/client';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async createTemplate(@Body() createDto: CreateTemplateDto) {
    return this.onboardingService.createTemplate(createDto);
  }

  @Get('templates')
  async findAllTemplates(@CurrentUser('organizationId') orgId: string) {
    return this.onboardingService.findAllTemplates(orgId);
  }

  @Get('templates/:id')
  async findTemplateById(@Param('id') id: string) {
    return this.onboardingService.findTemplateById(id);
  }

  @Put('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
  ) {
    return this.onboardingService.updateTemplate(id, updateDto);
  }

  @Delete('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async deleteTemplate(@Param('id') id: string) {
    return this.onboardingService.deleteTemplate(id);
  }

  @Get('checklists')
  async findAllChecklists(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: ChecklistType,
    @Query('search') search?: string,
  ) {
    if (role === Role.HR || role === Role.MANAGER) {
      return this.onboardingService.findAllChecklists(orgId, { employeeId, type, search });
    }

    const employee = await this.onboardingService['prisma'].employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      return [];
    }

    return this.onboardingService.findChecklistsByEmployee(employee.id);
  }

  @Get('checklists/:id')
  async findChecklistById(@Param('id') id: string) {
    return this.onboardingService.findChecklistById(id);
  }

  @Put('checklists/:checklistId/items/:itemId')
  async updateItemStatus(
    @Param('checklistId') checklistId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateItemStatusDto,
  ) {
    return this.onboardingService.updateItemStatus(checklistId, itemId, updateDto.status);
  }

  @Post('checklists/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async assignChecklist(
    @Body() assignDto: AssignChecklistDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.onboardingService.assignChecklistToEmployees(
      assignDto.templateId,
      assignDto.employeeIds,
      assignDto.type,
      orgId,
    );
  }
}
