import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PipsService } from './pips.service';
import { CreatePipDto } from './dto/create-pip.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, PipStatus } from '@prisma/client';

@Controller('pips')
@UseGuards(JwtAuthGuard)
export class PipsController {
  constructor(private pipsService: PipsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER, Role.HR)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreatePipDto,
  ) {
    return this.pipsService.create(createDto, userId);
  }

  @Get('my-pips')
  async getMyPips(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.pipsService.findMyPips(orgId, userId);
  }

  @Get('created-by-me')
  async getCreatedByMe(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.pipsService.findCreatedByUser(orgId, userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async getAllPips(
    @CurrentUser('organizationId') orgId: string,
    @Query('status') status?: PipStatus,
  ) {
    return this.pipsService.findAll(orgId, { status });
  }

  @Get()
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
    @Body('employeeId') employeeId?: string,
    @Body('status') status?: PipStatus,
  ) {
    if (role === Role.HR) {
      return this.pipsService.findAll(orgId, { employeeId, status });
    }

    return this.pipsService.findAll(orgId, {
      createdById: userId,
      employeeId,
      status,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.pipsService.findById(id);
  }

  @Put(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async approve(@Param('id') id: string) {
    return this.pipsService.approve(id);
  }

  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.HR)
  async reject(@Param('id') id: string) {
    return this.pipsService.reject(id);
  }

  @Put(':id/items/:itemId/toggle')
  async toggleItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.pipsService.toggleItem(id, itemId);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() addNoteDto: AddNoteDto,
  ) {
    return this.pipsService.addNote(id, userId, addNoteDto.text);
  }
}
