import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        departments: {
          include: {
            _count: {
              select: { employees: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async updateOrganization(organizationId: string, data: { name?: string; industry?: string; size?: string; country?: string; website?: string }) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  async createDepartment(organizationId: string, name: string) {
    const existing = await this.prisma.department.findFirst({
      where: { name, organizationId },
    });

    if (existing) {
      throw new NotFoundException('Department with this name already exists');
    }

    return this.prisma.department.create({
      data: { name, organizationId },
    });
  }

  async updateDepartment(id: string, name: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    const existing = await this.prisma.department.findFirst({
      where: { name, organizationId: dept.organizationId, NOT: { id } },
    });

    if (existing) {
      throw new NotFoundException('Department with this name already exists');
    }

    return this.prisma.department.update({
      where: { id },
      data: { name },
    });
  }

  async deleteDepartment(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    if (dept._count.employees > 0) {
      throw new ForbiddenException('Cannot delete department with employees');
    }

    return this.prisma.department.delete({ where: { id } });
  }

  async getUsersByRole(organizationId: string, role: Role) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
            department: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { email: 'asc' }],
    });

    return users;
  }

  async getRoleStats(organizationId: string) {
    const [hrCount, managerCount, employeeCount] = await Promise.all([
      this.prisma.user.count({ where: { organizationId, role: Role.HR } }),
      this.prisma.user.count({ where: { organizationId, role: Role.MANAGER } }),
      this.prisma.user.count({ where: { organizationId, role: Role.EMPLOYEE } }),
    ]);

    return {
      HR: hrCount,
      MANAGER: managerCount,
      EMPLOYEE: employeeCount,
    };
  }

  async updateUserRole(userId: string, role: Role, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot update user from different organization');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatar: true,
            department: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async getEmployeeProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        mustChangePassword: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
            address: true,
            jobTitle: true,
            workLocation: true,
            startDate: true,
            avatar: true,
            department: {
              select: { id: true, name: true },
            },
            manager: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateEmployeeProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    avatar?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { employee: { select: { id: true } } },
    });

    if (!user?.employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const updateData: any = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    return this.prisma.employee.update({
      where: { id: user.employee.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        avatar: true,
      },
    });
  }
}
