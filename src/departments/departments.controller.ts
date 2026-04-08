import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BulkCreateDepartmentDto } from './dto/bulk-create-department.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async create(@Body() createDeptDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDeptDto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async bulkCreate(@Body() bulkDto: BulkCreateDepartmentDto) {
    return this.departmentsService.bulkCreate(bulkDto.names, bulkDto.organizationId);
  }

  @Get()
  async findAll(@CurrentUser('organizationId') orgId: string) {
    return this.departmentsService.findAll(orgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async update(
    @Param('id') id: string,
    @Body() updateDeptDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDeptDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async delete(@Param('id') id: string) {
    return this.departmentsService.delete(id);
  }
}
