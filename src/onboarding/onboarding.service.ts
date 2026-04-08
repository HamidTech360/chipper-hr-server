import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChecklistType, ChecklistStatus, Role, Prisma } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

interface ChecklistItemTemplate {
  title: string;
  assignee: Role;
  dueInDays: number;
}

interface ChecklistItem {
  id: string;
  title: string;
  assignee: Role;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  completedAt: string | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(createDto: CreateTemplateDto) {
    return this.prisma.checklistTemplate.create({
      data: {
        name: createDto.name,
        items: createDto.items as unknown as Prisma.InputJsonValue,
        organizationId: createDto.organizationId,
      },
    });
  }

  async findAllTemplates(organizationId: string) {
    return this.prisma.checklistTemplate.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findTemplateById(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    return template;
  }

  async updateTemplate(id: string, updateDto: UpdateTemplateDto) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    return this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        name: updateDto.name,
        items: updateDto.items as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    return this.prisma.checklistTemplate.delete({
      where: { id },
    });
  }

  async assignChecklist(
    employeeId: string,
    type: ChecklistType,
    organizationId: string,
  ) {
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { organizationId, type },
    });

    if (!template) {
      return null;
    }

    const templateItems = template.items as unknown as ChecklistItemTemplate[];
    const items: ChecklistItem[] = templateItems.map((item) => ({
      id: generateId(),
      title: item.title,
      assignee: item.assignee,
      status: 'PENDING',
      dueDate: addDays(new Date(), item.dueInDays).toISOString(),
      completedAt: null,
    }));

    return this.prisma.employeeChecklist.create({
      data: {
        type,
        employeeId,
        items: items as unknown as Prisma.InputJsonValue,
        status: 'PENDING',
        progress: 0,
        organizationId,
      },
    });
  }

  async findAllChecklists(organizationId: string, filters?: {
    employeeId?: string;
    type?: ChecklistType;
    search?: string;
  }) {
    const where: any = { organizationId };

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const checklists = await this.prisma.employeeChecklist.findMany({
      where,
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
            startDate: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      return checklists.filter(cl => {
        const empName = `${cl.employee.firstName} ${cl.employee.lastName}`.toLowerCase();
        return empName.includes(search);
      });
    }

    return checklists;
  }

  async findChecklistById(id: string) {
    const checklist = await this.prisma.employeeChecklist.findUnique({
      where: { id },
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
            startDate: true,
          },
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    return checklist;
  }

  async findChecklistsByEmployee(employeeId: string) {
    return this.prisma.employeeChecklist.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignChecklistToEmployees(
    templateId: string,
    employeeIds: string[],
    type: ChecklistType,
    organizationId: string,
  ) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    const results = [];
    for (const employeeId of employeeIds) {
      const existing = await this.prisma.employeeChecklist.findFirst({
        where: {
          employeeId,
          type,
        },
      });

      if (existing) {
        continue;
      }

      const templateItems = template.items as unknown as ChecklistItemTemplate[];
      const items: ChecklistItem[] = templateItems.map((item) => ({
        id: generateId(),
        title: item.title,
        assignee: item.assignee,
        status: 'PENDING',
        dueDate: addDays(new Date(), item.dueInDays).toISOString(),
        completedAt: null,
      }));

      const checklist = await this.prisma.employeeChecklist.create({
        data: {
          type,
          employeeId,
          items: items as unknown as Prisma.InputJsonValue,
          status: 'PENDING',
          progress: 0,
          organizationId,
          templateId,
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
              startDate: true,
            },
          },
        },
      });
      results.push(checklist);
    }

    return results;
  }

  async updateItemStatus(
    checklistId: string,
    itemId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
  ) {
    const checklist = await this.prisma.employeeChecklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const items = checklist.items as unknown as ChecklistItem[];
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found');
    }

    items[itemIndex].status = status;
    if (status === 'COMPLETED') {
      items[itemIndex].completedAt = new Date().toISOString();
    } else {
      items[itemIndex].completedAt = null;
    }

    const completedCount = items.filter((item) => item.status === 'COMPLETED').length;
    const progress = Math.round((completedCount / items.length) * 100);

    let checklistStatus: ChecklistStatus = 'IN_PROGRESS';
    if (progress === 100) {
      checklistStatus = 'COMPLETED';
    } else if (progress === 0) {
      checklistStatus = 'PENDING';
    }

    return this.prisma.employeeChecklist.update({
      where: { id: checklistId },
      data: {
        items: items as unknown as Prisma.InputJsonValue,
        progress,
        status: checklistStatus,
      },
    });
  }
}
