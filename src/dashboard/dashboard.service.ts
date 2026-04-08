import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Employee } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(organizationId: string, userId: string, role: Role) {
    const [
      totalEmployees,
      activeEmployees,
      onLeave,
      departments,
      activeReviewCycles,
      activeOkrPeriods,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId } }),
      this.prisma.employee.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { organizationId, status: 'ON_LEAVE' } }),
      this.prisma.department.count({ where: { organizationId } }),
      this.prisma.reviewCycle.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.okrPeriod.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
    ]);

    const stats = {
      totalEmployees,
      activeEmployees,
      onLeave,
      departments,
      activeReviewCycles,
      activeOkrPeriods,
    };

    return stats;
  }

  async getDepartmentStats(organizationId: string) {
    const departments = await this.prisma.department.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((dept: any) => ({
      id: dept.id,
      name: dept.name,
      employeeCount: dept._count.employees,
    }));
  }

  async getRecentActivity(organizationId: string) {
    const recentChecklists = await this.prisma.employeeChecklist.findMany({
      where: { employee: { organizationId } },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const recentPips = await this.prisma.pip.findMany({
      where: { organizationId },
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
      take: 5,
    });

    return {
      checklists: recentChecklists.map((cl: any) => ({
        id: cl.id,
        type: cl.type,
        status: cl.status,
        progress: cl.progress,
        employee: cl.employee,
        updatedAt: cl.updatedAt,
      })),
      pips: recentPips.map((pip: any) => ({
        id: pip.id,
        status: pip.status,
        employee: pip.employee,
        createdAt: pip.createdAt,
      })),
    };
  }
}
