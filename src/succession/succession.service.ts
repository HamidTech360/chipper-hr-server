import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSuccessionPlanDto, UpdateSuccessionPlanDto } from './dto/create-succession-plan.dto';

@Injectable()
export class SuccessionService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSuccessionPlanDto, organizationId: string) {
    return this.prisma.successionPlan.create({
      data: {
        roleTitle: createDto.roleTitle,
        currentHolderId: createDto.currentHolderId,
        riskIndicators: createDto.riskIndicators as unknown as Prisma.InputJsonValue,
        successors: createDto.successors as unknown as Prisma.InputJsonValue,
        notes: createDto.notes,
        organizationId,
      },
      include: {
        currentHolder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.successionPlan.findMany({
      where: { organizationId },
      include: {
        currentHolder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.successionPlan.findUnique({
      where: { id },
      include: {
        currentHolder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Succession plan not found');
    }

    return plan;
  }

  async update(id: string, updateDto: UpdateSuccessionPlanDto) {
    const plan = await this.prisma.successionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Succession plan not found');
    }

    const data: any = {};
    if (updateDto.roleTitle !== undefined) data.roleTitle = updateDto.roleTitle;
    if (updateDto.currentHolderId !== undefined) data.currentHolderId = updateDto.currentHolderId;
    if (updateDto.riskIndicators !== undefined) data.riskIndicators = updateDto.riskIndicators as unknown as Prisma.InputJsonValue;
    if (updateDto.notes !== undefined) data.notes = updateDto.notes;
    if (updateDto.successors !== undefined) data.successors = updateDto.successors as unknown as Prisma.InputJsonValue;

    return this.prisma.successionPlan.update({
      where: { id },
      data,
      include: {
        currentHolder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const plan = await this.prisma.successionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Succession plan not found');
    }

    return this.prisma.successionPlan.delete({
      where: { id },
    });
  }
}
