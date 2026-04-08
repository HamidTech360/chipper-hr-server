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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { BulkCreateEmployeeDto } from './dto/bulk-create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, EmployeeStatus } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async create(@Body() createEmpDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmpDto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async bulkCreate(@Body() bulkDto: BulkCreateEmployeeDto) {
    return this.employeesService.bulkCreate(bulkDto);
  }

  @Get()
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: EmployeeStatus,
    @Query('search') search?: string,
    @Query('managerId') managerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.employeesService.findAll(orgId, {
      departmentId,
      status,
      search,
      managerId,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('managers')
  async getManagers(@CurrentUser('organizationId') orgId: string) {
    return this.employeesService.getManagers(orgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Get(':id/direct-reports')
  async getDirectReports(@Param('id') id: string) {
    return this.employeesService.getDirectReports(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async update(
    @Param('id') id: string,
    @Body() updateEmpDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmpDto);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.employeesService.updateStatus(id, updateStatusDto.status);
  }
}
