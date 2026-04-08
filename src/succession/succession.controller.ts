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
import { SuccessionService } from './succession.service';
import { CreateSuccessionPlanDto, UpdateSuccessionPlanDto } from './dto/create-succession-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('succession')
@UseGuards(JwtAuthGuard)
export class SuccessionController {
  constructor(private successionService: SuccessionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async create(
    @Body() createDto: CreateSuccessionPlanDto,
    @CurrentUser('organizationId') orgId: string,
  ) {
    return this.successionService.create(createDto, orgId);
  }

  @Get()
  async findAll(@CurrentUser('organizationId') orgId: string) {
    return this.successionService.findAll(orgId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.successionService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSuccessionPlanDto,
  ) {
    return this.successionService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async remove(@Param('id') id: string) {
    return this.successionService.remove(id);
  }
}
