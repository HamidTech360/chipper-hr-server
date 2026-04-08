import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipStatus, Role, Prisma } from '@prisma/client';
import { CreatePipDto } from './dto/create-pip.dto';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface PipItem {
  id: string;
  text: string;
  completed: boolean;
}

interface PipNote {
  id: string;
  authorId: string;
  authorName: string;
  date: string;
  text: string;
}

@Injectable()
export class PipsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePipDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: createDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (user.role !== Role.HR && user.role !== Role.MANAGER) {
      throw new BadRequestException('Only HR and Managers can create PIPs');
    }

    const items: PipItem[] = createDto.items.map((text) => ({
      id: generateId(),
      text,
      completed: false,
    }));

    return this.prisma.pip.create({
      data: {
        employeeId: createDto.employeeId,
        createdById: userId,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        reason: createDto.reason,
        items: items as unknown as Prisma.InputJsonValue,
        notes: [] as unknown as Prisma.InputJsonValue,
        organizationId: createDto.organizationId,
        status: PipStatus.PENDING_APPROVAL,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            jobTitle: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findMyPips(organizationId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user?.employee) {
      return [];
    }

    return this.prisma.pip.findMany({
      where: {
        organizationId,
        employeeId: user.employee.id,
        status: { in: [PipStatus.ACTIVE, PipStatus.COMPLETED] },
      },
      include: this.includePipRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCreatedByUser(organizationId: string, userId: string) {
    return this.prisma.pip.findMany({
      where: {
        organizationId,
        createdById: userId,
      },
      include: this.includePipRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(organizationId: string, filters?: {
    employeeId?: string;
    createdById?: string;
    status?: PipStatus;
  }) {
    const where: any = { organizationId };

    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.createdById) where.createdById = filters.createdById;
    if (filters?.status) where.status = filters.status;

    return this.prisma.pip.findMany({
      where,
      include: this.includePipRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  private includePipRelations() {
    return {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          jobTitle: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    };
  }

  async findById(id: string) {
    const pip = await this.prisma.pip.findUnique({
      where: { id },
      include: this.includePipRelations(),
    });

    if (!pip) {
      throw new NotFoundException('PIP not found');
    }

    return pip;
  }

  async approve(id: string) {
    const pip = await this.prisma.pip.findUnique({
      where: { id },
    });

    if (!pip) {
      throw new NotFoundException('PIP not found');
    }

    if (pip.status !== PipStatus.PENDING_APPROVAL) {
      throw new BadRequestException('PIP is not pending approval');
    }

    return this.prisma.pip.update({
      where: { id },
      data: { status: PipStatus.ACTIVE },
    });
  }

  async reject(id: string) {
    const pip = await this.prisma.pip.findUnique({
      where: { id },
    });

    if (!pip) {
      throw new NotFoundException('PIP not found');
    }

    if (pip.status !== PipStatus.PENDING_APPROVAL) {
      throw new BadRequestException('PIP is not pending approval');
    }

    return this.prisma.pip.update({
      where: { id },
      data: { status: PipStatus.REJECTED },
    });
  }

  async toggleItem(pipId: string, itemId: string) {
    const pip = await this.prisma.pip.findUnique({
      where: { id: pipId },
    });

    if (!pip) {
      throw new NotFoundException('PIP not found');
    }

    if (pip.status !== PipStatus.ACTIVE) {
      throw new BadRequestException('PIP is not active');
    }

    const items = pip.items as unknown as PipItem[];
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found');
    }

    items[itemIndex].completed = !items[itemIndex].completed;

    const allCompleted = items.every((item) => item.completed);

    return this.prisma.pip.update({
      where: { id: pipId },
      data: {
        items: items as unknown as Prisma.InputJsonValue,
        status: allCompleted ? PipStatus.COMPLETED : PipStatus.ACTIVE,
      },
    });
  }

  async addNote(pipId: string, userId: string, text: string) {
    const pip = await this.prisma.pip.findUnique({
      where: { id: pipId },
      include: {
        createdBy: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!pip) {
      throw new NotFoundException('PIP not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (pip.createdById === userId && pip.status === PipStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Cannot add notes to a PIP that is pending approval');
    }

    const note: PipNote = {
      id: generateId(),
      authorId: userId,
      authorName: user.employee
        ? `${user.employee.firstName} ${user.employee.lastName}`
        : user.email,
      date: new Date().toISOString(),
      text,
    };

    const notes = [...(pip.notes as unknown as PipNote[]), note];

    return this.prisma.pip.update({
      where: { id: pipId },
      data: { notes: notes as unknown as Prisma.InputJsonValue },
    });
  }
}
