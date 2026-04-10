import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Employee } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(organizationId: string) {
    const [
      totalEmployees,
      activeEmployees,
      onLeave,
      departments,
      activeReviews,
      activeOkrPeriods,
      totalOkrs,
      completedOkrs,
      totalPips,
      activePips,
      pendingLeaveRequests,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId } }),
      this.prisma.employee.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { organizationId, status: 'ON_LEAVE' } }),
      this.prisma.department.count({ where: { organizationId } }),
      this.prisma.review.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.okrPeriod.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.okr.count({ where: { organizationId } }),
      this.prisma.okr.count({ where: { organizationId, status: 'DONE' } }),
      this.prisma.pip.count({ where: { organizationId } }),
      this.prisma.pip.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({ where: { organizationId, status: 'PENDING' } }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      onLeave,
      departments,
      activeReviews,
      activeOkrPeriods,
      totalOkrs,
      completedOkrs,
      totalPips,
      activePips,
      pendingLeaveRequests,
    };
  }

  async getOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        industry: true,
      },
    });
    return org;
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

  async getRecentOkrPeriods(organizationId: string) {
    const periods = await this.prisma.okrPeriod.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        _count: {
          select: { okrs: true },
        },
      },
    });

    return periods.map((period: any) => ({
      id: period.id,
      name: period.name,
      status: period.status,
      startDate: period.startDate,
      endDate: period.endDate,
      okrCount: period._count.okrs,
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
